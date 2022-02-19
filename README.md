intruduction  


1: install  
npm install @glen-tool/cli  
usage example: glen-cli init -d  
then choose your template or exec your customized script by use config: --targetPath=[script path]    

params:  
-d, --debug;  
-f, --force: init project forcibly, del the current path directory  
--targetPath: specify the execution script in local path(note: in you script need package.json to specify main path, in your main script need to module.exports the function, cli will pass parameter)    

illustrate:  
creat ".env" file in your userHome path and cli script will read it as environment variable:  
useful environment variable includes:  
CLI_HOME=[path for store template just like workspace]    
LOG_LEVEL=['verbose' or 'info']  
GLEN_CLI_BASE_URL=[your mongodb url] if not exist will use default  template  

