use super::{
    GpuSupport, ModuleInfo, ModuleSolution, OptimizeOptions,
    check_gpu_support as check_gpu_support_internal, optimize_modules, parse_modules_from_vdata,
    strategy_enumeration_cpu, strategy_enumeration_gpu,
};
use crate::database::schema::detailed_playerdata::dsl as dpd;
use crate::database::db_exec;
use blueprotobuf_lib::blueprotobuf::CharSerialize;
use diesel::prelude::*;
use prost::Message;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter};
use tokio::time::{Duration, sleep};

#[tauri::command]
#[specta::specta]
pub fn check_gpu_support() -> GpuSupport {
    check_gpu_support_internal()
}

fn load_latest_char_serialize() -> Result<CharSerialize, String> {
    let vdata_bytes: Option<Vec<u8>> = db_exec(|conn| {
        dpd::detailed_playerdata
            .select(dpd::vdata_bytes)
            .order(dpd::last_seen_ms.desc())
            .first(conn)
            .map_err(|e| {
                if e.to_string().contains("NotFound") || e.to_string().contains("record") {
                    "请先进入游戏场景，等待数据捕获后再刷新".to_string()
                } else {
                    e.to_string()
                }
            })
    })?;

    log::info!(
        "加载最新玩家数据: vdata_bytes_len={:?}",
        vdata_bytes.as_ref().map(|b| b.len())
    );

    if let Some(bytes) = vdata_bytes {
        CharSerialize::decode(bytes.as_slice()).map_err(|e| e.to_string())
    } else {
        Err("请先进入游戏场景，等待数据捕获后再刷新".to_string())
    }
}

#[tauri::command]
#[specta::specta]
pub fn get_latest_modules() -> Result<Vec<ModuleInfo>, String> {
    let vdata = load_latest_char_serialize()?;
    Ok(parse_modules_from_vdata(&vdata))
}

#[tauri::command]
#[specta::specta]
pub async fn optimize_latest_modules(
    app: AppHandle,
    target_attributes: Vec<i32>,
    exclude_attributes: Vec<i32>,
    min_attr_requirements: Option<HashMap<i32, i32>>,
    use_gpu: Option<bool>,
    min_module_score: Option<i32>,
) -> Result<Vec<ModuleSolution>, String> {
    log::info!(
        "收到优化请求: target={:?}, exclude={:?}, min_req={:?}, gpu={:?}, min_score={:?}",
        target_attributes,
        exclude_attributes,
        min_attr_requirements,
        use_gpu,
        min_module_score
    );

    let vdata = load_latest_char_serialize()?;
    let mut modules = parse_modules_from_vdata(&vdata);

    // 过滤低属性值总和的模组
    let min_score = min_module_score.unwrap_or(0);
    if min_score > 0 {
        let before_count = modules.len();
        modules = modules
            .into_iter()
            .filter(|m| {
                let total: i32 = m.parts.iter().map(|p| p.value).sum();
                total >= min_score
            })
            .collect();
        log::info!(
            "按属性值总和过滤: {} -> {} (阈值: {})",
            before_count,
            modules.len(),
            min_score
        );
    }

    log::info!(
        "模组数量: {} (target_attrs: {:?})",
        modules.len(),
        target_attributes
    );

    if modules.len() < 5 {
        return Err("需要至少 5 个模组".to_string());
    }

    let max_workers = std::thread::available_parallelism()
        .map(|n| n.get() as i32)
        .unwrap_or(8);

    let options = OptimizeOptions {
        target_attributes,
        exclude_attributes,
        min_attr_requirements: min_attr_requirements.unwrap_or_default(),
        max_solutions: 10,
        max_workers,
        use_gpu: use_gpu.unwrap_or(true),
    };

    // Reset progress
    super::reset_progress();

    // Spawn progress monitor
    let app_handle = app.clone();
    tokio::spawn(async move {
        loop {
            let (processed, total) = super::get_progress();
            if total > 0 {
                let _ = app_handle.emit("module-calc-progress", (processed, total));
                if processed >= total {
                    break;
                }
            }
            sleep(Duration::from_millis(100)).await;
        }
    });

    let result = tokio::task::spawn_blocking(move || {
        if options.use_gpu {
            strategy_enumeration_gpu(&modules, &options)
        } else {
            strategy_enumeration_cpu(&modules, &options)
        }
    })
    .await
    .map_err(|e| e.to_string())?;

    let result: Vec<ModuleSolution> = result.into_iter().take(10).collect();

    let _ = app.emit("module-calc-complete", &result);

    Ok(result)
}

#[tauri::command]
#[specta::specta]
pub fn greedy_optimize_modules(
    modules: Vec<ModuleInfo>,
    target_attributes: Vec<i32>,
    exclude_attributes: Vec<i32>,
    max_solutions: Option<i32>,
    max_attempts_multiplier: Option<i32>,
    local_search_iterations: Option<i32>,
) -> Result<Vec<ModuleSolution>, String> {
    if modules.len() < 5 {
        return Err("需要至少 5 个模组".to_string());
    }

    let result = optimize_modules(
        &modules,
        &target_attributes,
        &exclude_attributes,
        max_solutions.unwrap_or(60),
        max_attempts_multiplier.unwrap_or(20),
        local_search_iterations.unwrap_or(30),
    );

    Ok(result)
}
