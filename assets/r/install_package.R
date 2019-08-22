trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
package<-trim(args[1])	# package to install

if (!require(package)) { 
	install.packages(package, repos = "http://cran.us.r-project.org")
}