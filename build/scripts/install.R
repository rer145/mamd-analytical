print("Starting Install of R Packages")

trim <- function (x) gsub("^\\s+|\\s+$", "", x)
args<-commandArgs(trailingOnly=TRUE)

do.package.install<-function(pkg_name, pkg_file) {
  print(paste("  Installing package:", pkg_name))
  if (!require(pkg_name, lib.loc=dest_path, character.only=TRUE, warn.conflicts=FALSE)) {
    tryCatch(
      {
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
  } else {
    print("    Package already installed")
  }
}

src_path<-trim(args[1])
dest_path<-trim(args[2])

if (is.na(src_path)) {
  print("  ERROR: Cannot install - no source path defined")
}

if (is.na(dest_path)) {
  print("  ERROR: Cannot install - no destination path defined")
}


if (!is.na(src_path) && !is.na(dest_path)) {
  print(paste("Installing FROM", src_path))
  print(paste("Installing TO", dest_path))
  
  do.package.install("ModelMetrics", "ModelMetrics_1.2.2.1.tar.gz")
  do.package.install("nnet", "nnet_7.3-12.tar.gz")
  do.package.install("dplyr", "dplyr_0.8.4.tar.gz")
  do.package.install("caret", "caret_6.0-85.tar.gz")
  do.package.install("e1071", "e1071_1.7-3.tar.gz")
}

print("Finished Install of R Packages")