trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
package<-trim(args[1])	# package to verify

installed<-require(package)
#print("INSTALLATION: [" + installed + "]")
installed
