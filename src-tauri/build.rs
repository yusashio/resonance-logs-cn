use std::env;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    // Read version from tauri.conf.json and expose as APP_VERSION environment variable
    let tauri_conf =
        std::fs::read_to_string("tauri.conf.json").expect("Failed to read tauri.conf.json");
    let conf: serde_json::Value =
        serde_json::from_str(&tauri_conf).expect("Failed to parse tauri.conf.json");
    let version = conf["version"]
        .as_str()
        .expect("No version field in tauri.conf.json");
    println!("cargo:rustc-env=APP_VERSION={}", version);

    // Forward API URLs from build environment to compile-time env vars
    if let Ok(url) = env::var("UPLOAD_API_URL") {
        println!("cargo:rustc-env=UPLOAD_API_URL={}", url);
    }
    if let Ok(url) = env::var("TRACKING_API_URL") {
        println!("cargo:rustc-env=TRACKING_API_URL={}", url);
    }

    // Build module_optimizer C++ code
    build_module_optimizer();

    // Use the standard debug_assertions cfg to differentiate dev vs release.
    if cfg!(debug_assertions) {
        println!("DEBUG (dev) BUILD");
        tauri_build::build();
    } else {
        let mut windows = tauri_build::WindowsAttributes::new();
        windows = windows.app_manifest(include_str!("app.manifest"));
        tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
            .expect("failed to run build script");
    }
}

fn build_module_optimizer() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let cpp_dir = manifest_dir.join("src/module_optimizer/cpp");

    // Check if cpp directory exists
    if !cpp_dir.exists() {
        println!(
            "cargo:warning=C++ directory not found: {:?}, skipping module_optimizer build",
            cpp_dir
        );
        return;
    }

    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());

    // Detect CUDA and OpenCL
    let use_cuda = detect_cuda();
    let use_opencl = detect_opencl();

    println!("cargo:warning=CUDA detected: {}", use_cuda);
    println!("cargo:warning=OpenCL detected: {}", use_opencl);

    // Build C++ source files list
    let mut cpp_sources = vec![
        cpp_dir.join("module_optimizer.cpp"),
        cpp_dir.join("ffi_bridge.cpp"),
    ];

    // Compile CUDA code if available
    let cuda_obj = if use_cuda {
        compile_cuda(&cpp_dir, &out_dir)
    } else {
        None
    };

    let cuda_enabled = cuda_obj.is_some();
    if cuda_enabled {
        println!("cargo:rustc-cfg=feature=\"cuda\"");
    }

    // Add OpenCL source file if available
    if use_opencl {
        println!("cargo:rustc-cfg=feature=\"opencl\"");
        cpp_sources.push(cpp_dir.join("module_optimizer_opencl.cpp"));
    }

    // Use cxx-build to compile
    let mut build = cxx_build::bridge("src/module_optimizer/bridge.rs");

    build
        .files(&cpp_sources)
        .include(&cpp_dir)
        .std("c++17")
        .flag_if_supported("/utf-8")
        .flag_if_supported("/EHsc")
        .flag_if_supported("/bigobj")
        .flag_if_supported("/MD")
        .flag_if_supported("-O2");

    // CUDA configuration
    if cuda_enabled {
        if let Some(cuda_home) = find_cuda_home() {
            println!("cargo:warning=Linking CUDA from: {}", cuda_home.display());
            
            build
                .define("USE_CUDA", None)
                .include(cuda_home.join("include"));

            // 将 CUDA bin 目录添加到链接搜索路径（运行时加载 DLL）
            println!(
                "cargo:rustc-link-search=native={}",
                cuda_home.join("bin").display()
            );
            println!(
                "cargo:rustc-link-search=native={}",
                cuda_home.join("lib/x64").display()
            );
            println!("cargo:rustc-link-lib=cudart_static");
            println!("cargo:rustc-link-lib=cuda");

            if let Some(ref obj) = cuda_obj {
                build.object(obj);
            }
        }
    }

    // OpenCL configuration
    if use_opencl {
        build.define("USE_OPENCL", None);

        // 添加 OpenCL 头文件路径
        if let Some(include_path) = get_opencl_include_path() {
            build.include(&include_path);
        }
        
        // 添加 OpenCL 库路径（系统路径不需要）
        if let Some(opencl_path) = find_opencl() {
            if opencl_path != PathBuf::from(r"C:\Windows\System32") {
                let lib_path = opencl_path.join("lib").join("x64");
                println!(
                    "cargo:rustc-link-search=native={}",
                    lib_path.display()
                );
            }
        }
        println!("cargo:rustc-link-lib=OpenCL");
    }

    build.compile("module_optimizer_cpp");

    // CUDA 运行时 DLL 复制（确保使用正确版本）
    // 参考 PyTorch 的做法：自带 CUDA 运行时 DLL，不依赖系统 CUDA
    if cuda_enabled {
        if let Some(cuda_home) = find_cuda_home() {
            let cuda_bin = cuda_home.join("bin");
            
            // 复制到 target/debug 或 target/release 目录
            let profile = if cfg!(debug_assertions) { "debug" } else { "release" };
            let target_dir = manifest_dir.join("target").join(profile);
            
            // CUDA 11.8 运行时 DLL 列表
            // cudart64_110.dll - CUDA 运行时核心
            // cublas64_11.dll, cublasLt64_11.dll - BLAS 库（如果用到）
            // cufft64_10.dll - FFT 库（如果用到）
            // curand64_10.dll - 随机数库（如果用到）
            let dlls_to_copy = [
                "cudart64_110.dll",
                "cublas64_11.dll", 
                "cublasLt64_11.dll",
                "cufft64_10.dll",
                "curand64_10.dll",
                "cusparse64_11.dll",
                "cusolver64_11.dll",
                "cusolverMg64_11.dll",
                "nppc64_11.dll",
                "nppial64_11.dll",
                "nppicc64_11.dll",
                "nppidei64_11.dll",
                "nppif64_11.dll",
                "nppig64_11.dll",
                "nppim64_11.dll",
                "nppist64_11.dll",
                "nppisu64_11.dll",
                "nppitc64_11.dll",
                "npps64_11.dll",
                "nvblas64_11.dll",
            ];
            
            let mut copied_count = 0;
            for dll in &dlls_to_copy {
                let src = cuda_bin.join(dll);
                let dst = target_dir.join(dll);
                if src.exists() {
                    match std::fs::copy(&src, &dst) {
                        Ok(_) => {
                            copied_count += 1;
                            println!("cargo:warning=Copied CUDA DLL: {}", dll);
                        }
                        Err(e) => println!("cargo:warning=Failed to copy {}: {}", dll, e),
                    }
                }
            }
            println!("cargo:warning=CUDA: Copied {} DLLs to {}", copied_count, target_dir.display());
        }
    }

    // Rerun if changed
    println!("cargo:rerun-if-changed=src/module_optimizer/bridge.rs");
    println!("cargo:rerun-if-changed=src/module_optimizer/cpp/");
}

fn detect_cuda() -> bool {
    // 首先尝试系统 PATH
    if Command::new("nvcc")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return true;
    }
    
    // 检查自定义 CUDA 路径
    if let Some(cuda_home) = find_cuda_home() {
        let nvcc_path = cuda_home.join("bin").join("nvcc.exe");
        if nvcc_path.exists() {
            println!("cargo:warning=Found nvcc at: {:?}", nvcc_path);
            return Command::new(&nvcc_path)
                .arg("--version")
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);
        }
    }
    
    false
}

fn detect_opencl() -> bool {
    // 首先检查是否能找到 OpenCL 头文件
    let has_opencl_headers = check_opencl_headers();
    if !has_opencl_headers {
        println!("cargo:warning=OpenCL headers not found, skipping OpenCL support");
        return false;
    }
    find_opencl().is_some()
}

fn check_opencl_headers() -> bool {
    get_opencl_include_path().is_some()
}

fn get_opencl_include_path() -> Option<PathBuf> {
    // 检查常见的 OpenCL 头文件位置
    let header_paths = [
        r"D:\work\toolkit\cuda dev\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.9\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.7\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.6\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.5\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.3\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.2\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.0\include",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\include",
    ];
    
    for path in &header_paths {
        let cl_header = PathBuf::from(path).join("CL").join("cl.h");
        if cl_header.exists() {
            println!("cargo:warning=Found OpenCL headers at: {}", path);
            return Some(PathBuf::from(path));
        }
    }
    
    // 检查环境变量指定的路径
    if let Ok(cuda_path) = env::var("CUDA_PATH") {
        let include_path = PathBuf::from(&cuda_path).join("include");
        let cl_header = include_path.join("CL").join("cl.h");
        if cl_header.exists() {
            println!("cargo:warning=Found OpenCL headers at: {:?}", include_path);
            return Some(include_path);
        }
    }
    
    None
}

fn find_cuda_home() -> Option<PathBuf> {
    // Try multiple possible paths
    let paths = [
        env::var("CUDA_HOME").ok(),
        env::var("CUDA_PATH").ok(),
        Some(r"D:\work\toolkit\cuda dev".to_string()),
        Some(r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.9".to_string()),
    ];

    for path in paths.into_iter().flatten() {
        let p = PathBuf::from(&path);
        if p.exists() {
            return Some(p);
        }
    }
    None
}

fn find_opencl() -> Option<PathBuf> {
    // Check CUDA path for OpenCL first (NVIDIA ships OpenCL with CUDA)
    if let Some(cuda_home) = find_cuda_home() {
        let opencl_lib = cuda_home.join("lib").join("x64").join("OpenCL.lib");
        if opencl_lib.exists() {
            println!("cargo:warning=Found OpenCL.lib at: {:?}", opencl_lib);
            return Some(cuda_home);
        }
    }

    // Check OPENCL_HOME environment variable
    if let Ok(opencl_home) = env::var("OPENCL_HOME") {
        let p = PathBuf::from(&opencl_home);
        if p.join("lib").join("x64").join("OpenCL.lib").exists() {
            return Some(p);
        }
    }

    // Check system OpenCL.dll (Windows System32) - last resort
    let system_opencl = PathBuf::from(r"C:\Windows\System32\OpenCL.dll");
    if system_opencl.exists() {
        return Some(PathBuf::from(r"C:\Windows\System32"));
    }

    None
}

fn compile_cuda(cpp_dir: &PathBuf, out_dir: &PathBuf) -> Option<PathBuf> {
    println!("cargo:warning=compile_cuda: starting...");
    
    let cuda_home = find_cuda_home()?;
    println!("cargo:warning=compile_cuda: cuda_home={}", cuda_home.display());
    
    let cuda_file = cpp_dir.join("module_optimizer_cuda.cu");
    let obj_file = out_dir.join("module_optimizer_cuda.obj");

    if !cuda_file.exists() {
        println!(
            "cargo:warning=CUDA source file not found: {:?}",
            cuda_file
        );
        return None;
    }
    println!("cargo:warning=compile_cuda: cuda_file exists");

    // 获取 nvcc 路径
    let nvcc_path = cuda_home.join("bin").join("nvcc.exe");
    if !nvcc_path.exists() {
        println!("cargo:warning=nvcc not found at: {:?}", nvcc_path);
        return None;
    }
    println!("cargo:warning=compile_cuda: nvcc_path={}", nvcc_path.display());

    // Find Visual Studio
    let vs_paths = [
        r"C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat",
        r"C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat",
        r"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat",
    ];

    let vs_vars = match vs_paths.iter().find(|p| PathBuf::from(p).exists()) {
        Some(p) => {
            println!("cargo:warning=compile_cuda: found VS at {}", p);
            p
        }
        None => {
            println!("cargo:warning=compile_cuda: Visual Studio not found!");
            return None;
        }
    };

    // Create a temporary batch file to handle environment setup and compilation
    let bat_file = out_dir.join("compile_cuda.bat");
    let nvcc_cmd = format!(
        r#""{}" -c "{}" -o "{}" -std=c++17 --compiler-options "/O2,/std:c++17,/EHsc,/MD,/utf-8" --use_fast_math -I"{}" -gencode=arch=compute_75,code=sm_75 -gencode=arch=compute_86,code=sm_86 -gencode=arch=compute_89,code=sm_89 -gencode=arch=compute_120,code=sm_120"#,
        nvcc_path.display(),
        cuda_file.display(),
        obj_file.display(),
        cuda_home.join("include").display()
    );

    let bat_content = format!(
        "@echo off\r\ncall \"{}\"\r\nif %errorlevel% neq 0 exit /b %errorlevel%\r\n{}\r\n",
        vs_vars, nvcc_cmd
    );

    std::fs::write(&bat_file, bat_content).expect("Failed to write compile_cuda.bat");

    println!("cargo:warning=Compiling CUDA using batch file: {}", bat_file.display());

    let output = Command::new("cmd")
        .args(["/C", bat_file.to_str().unwrap()])
        .output()
        .ok()?;

    if output.status.success() {
        println!("cargo:warning=CUDA compilation successful");
        Some(obj_file)
    } else {
        println!("cargo:warning=CUDA compilation failed, falling back to CPU version");
        println!("cargo:warning=CUDA output: {}", String::from_utf8_lossy(&output.stdout));
        println!("cargo:warning=CUDA error: {}", String::from_utf8_lossy(&output.stderr));
        None
    }
}
