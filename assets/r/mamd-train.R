trim <- function (x) gsub("^\\s+|\\s+$", "", x)

# command arguments
#args = commandArgs(trailingOnly=TRUE)
#packages_path<-trim(args[1])	# path to packages
#analysis_path<-trim(args[2])	# path to analysis files
#input_file<-trim(args[3])	# file where user inputs will be saved
#output_file<-trim(args[4])	# file where analysis output will be saved


# dev variables
packages_path<-""
analysis_path<-"D:\\work\\hefner\\hefner-electron-boilerplate\\assets\\r"
input_file<-"D:\\work\\hefner\\hefner-electron-boilerplate\\assets\\r\\1566844598628-input.csv"
output_file<-"D:\\work\\hefner\\hefner-electron-boilerplate\\assets\\r\\output.txt"


if (!require("ModelMetrics")) { 
  install.packages("ModelMetrics", repos = "http://cran.us.r-project.org")
}
if (!require("nnet")) { 
  install.packages("nnet", repos = "http://cran.us.r-project.org")
}
if (!require("dplyr")) { 
  install.packages("dplyr", repos = "http://cran.us.r-project.org")
}
if (!require("shiny")) { 
  install.packages("shiny", repos = "http://cran.us.r-project.org")
}

library(ModelMetrics)
library(nnet)
library(dplyr)
library(shiny)



set.seed(1234)
digits=4
options(scipen = 999)

# settings and configuration files
mamd<-read.csv(file.path(analysis_path, "mamd.csv"), sep=',', header = T)         
geo.origin<-read.csv(file.path(analysis_path, "Geo.Origin.csv"), sep=',', header = T) 

drops<-c("Group","X","X.1")
mamd<-mamd[, !(names(mamd) %in% drops)]

# mamd analysis
inputs<-read.csv(input_file, sep=',', header=T)

#fit<-nnet(x<-mamd, y<-inputs, size=10, rang=0.1, decay=5e-4, maxit=2000, trace=FALSE)


#filtereddata<-mamd %>% filter(Group %in% c(input$Group, input$Group1)) %>% droplevels()
#filtereddata1<-filtereddata[,-1]
ref <- dplyr::select_(filtereddata1, .dots = c("Group.1", names(elements()))) %>% droplevels()

aNN_data<-na.omit(ref) %>% droplevels()
aNN_formula<-as.formula(Group.1 ~ .)
fit<-nnet(aNN_formula, data=inputs, size=10, rang=0.1, decay=5e-4, maxit=2000, trace=FALSE)

f<-fitted(fit)
fr<-round(f, digits=3)

saveRDS(fit, "./mamd_model.rds")
