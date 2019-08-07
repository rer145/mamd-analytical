trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
args = commandArgs(trailingOnly=TRUE)
packages_path<-trim(args[1])	# path to packages
#analysis_path<-trim(args[2])	# path to analysis files
input_file<-trim(args[2])	# file where user inputs will be saved
output_file<-trim(args[3])	# file where analysis output will be saved


#if (!require("Rcpp", lib.loc=packages_path)) { 
#	install.packages("Rcpp", lib=packages_path)
#}
if (!require("ModelMetrics", lib.loc=packages_path)) { 
	install.packages("ModelMetrics", lib=packages_path)
} 
if (!require("nnet", lib.loc=packages_path)) { 
	install.packages("nnet", lib=packages_path)
} 
if (!require("dplyr", lib.loc=packages_path)) {
	install.packages("dplyr", lib=packages_path)
} 

library(ModelMetrics, lib.loc=packages_path)
library(nnet, lib.loc=packages_path)
library(dplyr, lib.loc=packages_path)
#library(knitr)
#library(reshape2)
#library(httr)
#library(e1071)
#library(caret)
#library(stats)
#library(ggplot2)
#library(png)

set.seed(1234)
digits=4
options(scipen = 999)



# settings and configuration files
mamd<-read.csv(file.path(data_path, "mamd.csv"), sep=',', header = T)         
geo.origin<-read.csv(file.path(data_path, "Geo.Origin.csv"), sep=',', header = T) 


# mamd analysis
aNN_mod <- eventReactive(input$evaluate, {                                            set.seed(1234)
    aNN_data<-na.omit(refsamp()) %>% droplevels()
    aNN_formula<-as.formula(Group.1 ~ .)                                                                      
    fit<-nnet(aNN_formula, data = aNN_data, size = 10, rang = 0.1,
              decay = 5e-4, maxit = 2000, trace=FALSE)                                                                     
    f<-fitted(fit)                                                                                            
    fr<-round(f,digits=3)
    mod <- predict(fit, type="class")
    mod<-as.factor(mod)
    ctab<-confusionMatrix(aNN_data$Group.1, mod)
    pred<-predict(fit, newdata = elements(),type=c("raw"))
    pred.post<-cbind(fit$xlevels,pred) 
    pred.post<-as.data.frame(pred.post,row.names = "Posterior Prob")
    pred.post$V1<-NULL
    pred.post<-format(round(pred, 3), nsmall = 3)
    pred.post
    
    aNNpred<-colnames(pred)[apply(pred,1,which.max)]
    
    return(list(aNN_data, fit, ctab,pred.post,aNNpred))
})


# generate output file
analysis<-aNN_mod()

if (!is.null(analysis))
{
	write(analysis[[4]], 
		file=output_file,
		ncolumns=if(is.character(analysis[[4]]) 1 else 5),
		append=TRUE,
		sep=" ")

	write("\n\n-----\n\n", file=output_file, append=TRUE)

	write(print(analysis[[5]]),
		file=output_file,
		ncolumns=if(is.character(analysis[[5]]) 1 else 5),
		append=TRUE,
		sep=" ")

	write("\n\n-----\n\n", file=output_file, append=TRUE)

	write(print(analysis[[3]]),
		file=output_file,
		ncolumns=if(is.character(analysis[[3]]) 1 else 5),
		append=TRUE,
		sep=" ")
}