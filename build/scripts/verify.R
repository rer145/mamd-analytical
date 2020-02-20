print("Verifying Install of R Packages")

trim <- function (x) gsub("^\\s+|\\s+$", "", x)
args<-commandArgs(trailingOnly=TRUE)

do.package.verify<-function(pkg_name) {
  print(paste("  Verifying package:", pkg_name))
  if (require(pkg_name, lib.loc=dest_path, character.only=TRUE, warn.conflicts=FALSE)) {
    print("    Package installation verified")
  } else {
    print("    Package installation CAN NOT be verified")
  }
}

dest_path<-trim(args[1])

if (is.na(dest_path)) {
  print("  ERROR: Cannot verify - no installation path defined")
}


if (!is.na(dest_path)) {
  print(paste("Verifying Installation IN", dest_path))
  
  do.package.verify("ModelMetrics")
  do.package.verify("nnet")
  do.package.verify("dplyr")
  do.package.verify("caret")
  do.package.verify("e1071")
}

print("Finished Verification of R Packages")