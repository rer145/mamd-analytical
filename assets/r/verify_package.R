trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
p<-trim(args[1])	# package to verify

installed<-require(p, character.only=TRUE)
#print("INSTALLATION: [" + installed + "]")
installed
