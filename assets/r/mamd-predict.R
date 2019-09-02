super_model <- readRDS("./mamd_model.rds")

print(super_model)
# make a predictions on "new data" using the final model
final_predictions <- predict(super_model, validation[,1:60])
confusionMatrix(final_predictions, validation$Class)










aNN_mod <- eventReactive(input$evaluate, {
  set.seed(1234)
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