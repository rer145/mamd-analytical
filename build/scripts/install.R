print("Starting Install of R Packages")

trim <- function (x) gsub("^\\s+|\\s+$", "", x)
args<-commandArgs(trailingOnly=TRUE)

do.package.install<-function(pkg_name, build_date) {
	print(paste("  Removing package:", pkg_name))
	tryCatch(
		{
			remove.packages(pkg_name, lib=dest_path)
			print("    Package removed successfully!")
		},
		error=function(cond) {
			print("    ERROR: Could not remove package")
    	print(cond)
		}
	)

  print(paste("  Installing package:", pkg_name))
  # if (!require(pkg_name, lib.loc=dest_path, character.only=TRUE, warn.conflicts=FALSE)) {
  if (!require(pkg_name, lib.loc=dest_path, character.only=TRUE, warn.conflicts=FALSE)) {
    tryCatch(
      {
        install.packages(
          pkg_name,
          repos=paste("https://mran.microsoft.com/snapshot/", build_date, sep=""),
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

dest_path<-trim(args[1])
#pkg_to_install<-trim(args[3])

# if (is.na(src_path)) {
#   print("  ERROR: Cannot install - no source path defined")
# }

if (is.na(dest_path)) {
  print("  ERROR: Cannot install - no destination path defined")
}


if (
#  !is.na(src_path) &&
  !is.na(dest_path)
) {
  #print(paste("Installing FROM", src_path))
  print(paste("Installing TO", dest_path))
  print(paste("libPaths()", .libPaths()))

  .libPaths(c(dest_path, .libPaths()))
  print(paste(".libPaths()", .libPaths()))

  # if (is.na(pkg_to_install)) {
    do.package.install("ModelMetrics", "2020-02-20")
    do.package.install("nnet", "2020-02-20")
    do.package.install("dplyr", "2020-02-20")
    do.package.install("caret", "2020-02-20")
    do.package.install("e1071", "2020-02-20")
  # } else {
  #   print(paste("Installing Package", pkg_to_install))
  #   do.package.install(pkg_to_install, "")
  # }
}

print("Finished Install of R Packages")
