trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
p<-trim(args[1])	# package to install

if (!require(p, character.only=TRUE)) { 
	install.packages(p, repos = "http://cran.us.r-project.org")
}