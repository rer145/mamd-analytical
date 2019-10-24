trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
packages_path<-trim(args[1])	# path to packages
analysis_path<-trim(args[2])	# path to analysis files
input_file<-trim(args[3])	# file where user inputs will be saved
output_file<-trim(args[4])	# file where analysis output will be saved


# package requirements
if (!require("ModelMetrics")) { 
	install.packages("ModelMetrics", repos = "http://cran.us.r-project.org")
}
if (!require("nnet")) { 
	install.packages("nnet", repos = "http://cran.us.r-project.org")
}
if (!require("dplyr")) { 
	install.packages("dplyr", repos = "http://cran.us.r-project.org")
}

library(ModelMetrics)
library(nnet)
library(dplyr)


# global options
set.seed(1234)
digits=4
options(scipen = 999)


# settings and configuration files
aNN_data<-read.csv(file.path(analysis_path, "mamd.csv"))
#geo.origin<-read.csv(file.path(analysis_path, "Geo.Origin.csv"), sep=',', header = T)
inputs<-read.csv(input_file, sep=',', header=T)


# mamd analysis
aNN_data = aNN_data[,!sapply(inputs, function(x) mean(is.na(x)))>0.5]
aNN_data = na.omit(aNN_data)

aNN_formula<-as.formula(Group ~ .)

fit<-nnet(aNN_formula, data=aNN_data, size=10, rang=0.1, decay=5e-4, maxit=2000, trace=FALSE)
f<-fitted(fit)
mod<-predict(fit, type="class")
mod<-as.factor(mod)

ctab<-caret::confusionMatrix(aNN_data$Group, mod)

pred<-predict(fit, newdata=inputs, type=c("raw"))
pred.post<-cbind(fit$xlevels, pred)
pred.post<-as.data.frame(pred.post, row.names="Posterior Prob")
pred.post$V1<-NULL
pred.post<-format(round(pred,3), nsmall=3)

aNNpred<-colnames(pred)[apply(pred, 1, which.max)]

# populate output file
write(aNNpred, 
		file=output_file,
		ncolumns=if(is.character(aNNpred) 1 else 5),
		append=TRUE,
		sep=" ")

write("\n\n-----\n\n", file=output_file, append=TRUE)

write(pred.post, 
		file=output_file,
		ncolumns=if(is.character(pred.post) 1 else 5),
		append=TRUE,
		sep=" ")

write("\n\n-----\n\n", file=output_file, append=TRUE)

write(ctab, 
		file=output_file,
		ncolumns=if(is.character(ctab) 1 else 5),
		append=TRUE,
		sep=" ")

write("\n\n-----\n\n", file=output_file, append=TRUE)
