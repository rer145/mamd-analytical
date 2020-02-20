print("Verifying Install of R Packages")

trim <- function (x) gsub("^\\s+|\\s+$", "", x)
args<-commandArgs(trailingOnly=TRUE)

do.package.verify<-function(pkg_name, pkg_file) {
  print(paste("  Verifying package:", pkg_name))
  if (require(pkg_name, lib.loc=dest_path, character.only=TRUE, warn.conflicts=FALSE)) {
    print("    Package installation verified")
  } else {
    print("    Package installation CAN NOT be verified")

    tryCatch(
      {
        print("    Attempting to reinstall package...")
        install.packages(
          paste(src_path, "\\", pkg_file, sep=""),
          repos=NULL,
          type="source",
          lib=dest_path, 
          verbose=FALSE,
          quiet=TRUE)
        print("    Package installed successfully!")
      },
      error=function(cond) {
        print("    ERROR: Could not install package")
        print(cond)
      }
    )
  }
}

src_path<-trim(args[1])
dest_path<-trim(args[2])

if (is.na(dest_path)) {
  print("  ERROR: Cannot verify - no installation path defined")
}


if (!is.na(dest_path)) {
  print(paste("Verifying Installation IN", dest_path))
  
  do.package.verify("ModelMetrics", "ModelMetrics_1.2.2.1.tar.gz")
  do.package.verify("nnet", "nnet_7.3-12.tar.gz")
  do.package.verify("dplyr", "dplyr_0.8.4.tar.gz")
  do.package.verify("caret", "caret_6.0-85.tar.gz")
  do.package.verify("e1071", "e1071_1.7-3.tar.gz")
}

print("Finished Verification of R Packages")