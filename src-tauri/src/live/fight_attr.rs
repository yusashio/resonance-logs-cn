use log::warn;
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::LazyLock;

const FIGHT_ATTR_TABLE_RELATIVE: &str = "meter-data/FightAttrTable.json";

#[derive(Debug, Clone, Deserialize)]
struct RawFightAttrEntry {
    #[serde(rename = "Id")]
    id: i32,
    #[serde(rename = "EnumName")]
    enum_name: String,
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "Type")]
    attr_type: String,
    #[serde(rename = "IsClass")]
    is_class: bool,
    #[serde(rename = "IsSyncMe")]
    is_sync_me: bool,
    #[serde(rename = "IsSyncAoi")]
    is_sync_aoi: bool,
    #[serde(rename = "AttrLowerLimit")]
    attr_lower_limit: i32,
    #[serde(rename = "AttrUpperLimit")]
    attr_upper_limit: i32,
    #[serde(rename = "Level")]
    level: i32,
    #[serde(rename = "AttrFinal")]
    attr_final: i32,
    #[serde(rename = "AttrTotal")]
    attr_total: i32,
    #[serde(rename = "AttrAdd")]
    attr_add: i32,
    #[serde(rename = "AttrExAdd")]
    attr_ex_add: i32,
    #[serde(rename = "AttrPer")]
    attr_per: i32,
    #[serde(rename = "AttrExPer")]
    attr_ex_per: i32,
    #[serde(rename = "AttrNumType")]
    attr_num_type: i32,
    #[serde(rename = "OfficialName")]
    official_name: String,
    #[serde(rename = "TipTemplate")]
    tip_template: String,
    #[serde(rename = "AttrDes")]
    attr_des: String,
    #[serde(rename = "BuffShowAttrHUD")]
    buff_show_attr_hud: i32,
    #[serde(rename = "AttrIcon")]
    attr_icon: Vec<String>,
    #[serde(rename = "Icon")]
    icon: String,
    #[serde(rename = "BaseAttr")]
    base_attr: i32,
    #[serde(rename = "RecomProfessionId")]
    recom_profession_id: Vec<i32>,
    #[serde(rename = "IsAssess")]
    is_assess: bool,
}

#[derive(Debug, Clone)]
pub struct FightAttr {
    pub id: i32,
    pub enum_name: String,
    pub name: String,
    pub attr_type: String,
    pub is_class: bool,
    pub is_sync_me: bool,
    pub is_sync_aoi: bool,
    pub attr_lower_limit: i32,
    pub attr_upper_limit: i32,
    pub level: i32,
    pub attr_final: i32,
    pub attr_total: i32,
    pub attr_add: i32,
    pub attr_ex_add: i32,
    pub attr_per: i32,
    pub attr_ex_per: i32,
    pub attr_num_type: i32,
    pub official_name: String,
    pub tip_template: String,
    pub attr_des: String,
    pub buff_show_attr_hud: i32,
    pub attr_icon: Vec<String>,
    pub icon: String,
    pub base_attr: i32,
    pub recom_profession_id: Vec<i32>,
    pub is_assess: bool,
}

static FIGHT_ATTR_MAP: LazyLock<HashMap<i32, FightAttr>> = LazyLock::new(|| {
    load_fight_attr_map().unwrap_or_else(|err| {
        warn!("[fight-attr] failed to load FightAttrTable.json: {}", err);
        HashMap::new()
    })
});

fn locate_meter_data_file(relative_path: &str) -> Option<PathBuf> {
    let mut p = PathBuf::from(relative_path);
    if p.exists() {
        return Some(p);
    }

    p = PathBuf::from(format!("src-tauri/{}", relative_path));
    if p.exists() {
        return Some(p);
    }

    if let Ok(mut exe_dir) = std::env::current_exe() {
        exe_dir.pop();
        let candidate = exe_dir.join(relative_path);
        if candidate.exists() {
            return Some(candidate);
        }

        let resources_dir = exe_dir.join("resources");
        let candidate = resources_dir.join(relative_path);
        if candidate.exists() {
            return Some(candidate);
        }
    }

    None
}

fn load_fight_attr_map() -> Result<HashMap<i32, FightAttr>, Box<dyn std::error::Error>> {
    let path = locate_meter_data_file(FIGHT_ATTR_TABLE_RELATIVE)
        .ok_or_else(|| format!("{} not found in known locations", FIGHT_ATTR_TABLE_RELATIVE))?;
    let contents = fs::read_to_string(path)?;
    let raw_map: HashMap<String, RawFightAttrEntry> = serde_json::from_str(&contents)?;

    let mut result = HashMap::new();
    for raw in raw_map.into_values() {
        let fight_attr = FightAttr {
            id: raw.id,
            enum_name: raw.enum_name,
            name: raw.name,
            attr_type: raw.attr_type,
            is_class: raw.is_class,
            is_sync_me: raw.is_sync_me,
            is_sync_aoi: raw.is_sync_aoi,
            attr_lower_limit: raw.attr_lower_limit,
            attr_upper_limit: raw.attr_upper_limit,
            level: raw.level,
            attr_final: raw.attr_final,
            attr_total: raw.attr_total,
            attr_add: raw.attr_add,
            attr_ex_add: raw.attr_ex_add,
            attr_per: raw.attr_per,
            attr_ex_per: raw.attr_ex_per,
            attr_num_type: raw.attr_num_type,
            official_name: raw.official_name,
            tip_template: raw.tip_template,
            attr_des: raw.attr_des,
            buff_show_attr_hud: raw.buff_show_attr_hud,
            attr_icon: raw.attr_icon,
            icon: raw.icon,
            base_attr: raw.base_attr,
            recom_profession_id: raw.recom_profession_id,
            is_assess: raw.is_assess,
        };
        result.insert(raw.id, fight_attr);
    }

    Ok(result)
}

pub fn get_fight_attr(attr_id: i32) -> Option<FightAttr> {
    FIGHT_ATTR_MAP.get(&attr_id).cloned()
}

pub fn get_attr_name(attr_id: i32) -> Option<String> {
    FIGHT_ATTR_MAP.get(&attr_id).map(|attr| attr.name.clone())
}

pub fn get_attr_description(attr_id: i32) -> Option<String> {
    FIGHT_ATTR_MAP.get(&attr_id).map(|attr| attr.attr_des.clone())
}

pub fn get_attr_official_name(attr_id: i32) -> Option<String> {
    FIGHT_ATTR_MAP.get(&attr_id).map(|attr| attr.official_name.clone())
}

pub fn get_attr_icon(attr_id: i32) -> Option<String> {
    FIGHT_ATTR_MAP.get(&attr_id).map(|attr| attr.icon.clone())
}

pub fn get_attr_num_type(attr_id: i32) -> i32 {
    FIGHT_ATTR_MAP.get(&attr_id)
        .map(|attr| attr.attr_num_type)
        .unwrap_or(0)
}
