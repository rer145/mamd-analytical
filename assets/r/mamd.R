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
if (!require("caret")) { 
	install.packages("caret", repos = "http://cran.us.r-project.org")
}
if (!require("e1071")) { 
	install.packages("e1071", repos = "http://cran.us.r-project.org")
}

library(ModelMetrics)
library(nnet)
library(dplyr)
library(caret)
library(e1071)


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
# apply same sapply to inputs to remove NA columns (or not pass in via original inputs file)
aNN_data = na.omit(aNN_data)
aNN_data$Group<-as.factor(aNN_data$Group)

aNN_formula<-as.formula(Group ~ .)

fit<-nnet::nnet(aNN_formula, data=aNN_data, size=10, rang=0.1, decay=5e-4, maxit=2000, trace=FALSE)
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
write("{", file=output_file, append=FALSE, sep="")


write(paste("\"prediction\": \"", trimws(aNNpred), "\", "), file=output_file, append=TRUE, sep="")
write(paste("\"sensitivity\": \"", trimws(gsub(paste("Class: ", trimws(aNNpred), sep=""), "", ctab$byClass[,"Sensitivity"][paste("Class: ", trimws(aNNpred), sep="")])), "\", "), file=output_file, append=TRUE, sep="")
write(paste("\"specificity\": \"", trimws(gsub(paste("Class: ", trimws(aNNpred), sep=""), "", ctab$byClass[,"Specificity"][paste("Class: ", trimws(aNNpred), sep="")])), "\", "), file=output_file, append=TRUE, sep="")

#gsub("Class: Thailand", "", ctab$byClass[,"Specificity"]["Class: Thailand"])

write("\"probabilities\": [", file=output_file, append=TRUE, sep="")
counter<-0
for (i in colnames(pred.post)) {
  counter<-counter+1
  write(paste("{\"group\": \"", trimws(i), "\", \"probability\": ", pred.post[1,i], "}", ifelse(counter!=length(pred.post), ",", "")), file=output_file, append=TRUE, sep="")
}
write("], ", file=output_file, append=TRUE, sep="")


write("\"matrix\": {", file=output_file, append=TRUE, sep="")
rcounter<-0
ccounter<-0
for(row in rownames(ctab$table)) {
  write(paste("\"", trimws(row), "\": ["), file=output_file, append=TRUE, sep="")
  rcounter<-rcounter+1
  ccounter<-0
  
  for (col in colnames(ctab$table)) {
    ccounter<-ccounter+1
    write(paste("{\"group\": \"", trimws(col), "\", \"score\":", trimws(ctab$table[row,col]), "}", ifelse(ccounter!=length(colnames(ctab$table)), ",", "")), file=output_file, append=TRUE, sep="")  
  }
  write(paste("]", ifelse(rcounter!=length(rownames(ctab$table)), ",", "")), file=output_file, append=TRUE, sep="")
}
write("}, ", file=output_file, append=TRUE, sep="")


write("\"statistics\": {", file=output_file, append=TRUE, sep="")
counter<-0
for(key in names(ctab$overall)){
  value<-ctab$overall[key]
  counter<-counter+1
  write(paste("\"", trimws(key), "\": \"", trimws(value), "\"", ifelse(counter!=length(ctab$overall), ",", "")), file=output_file, append=TRUE, sep="")
}
write("} ", file=output_file, append=TRUE, sep="")

write("}", file=output_file, append=TRUE, sep="")

