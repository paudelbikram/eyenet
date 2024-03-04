# eyenet
Eyenet is webpage/tool that let you visualize neural network inner workings in easy-to-understand way. This does not depend on any library rather uses neural network that is built from scratch called sajilonet provided in this same repo.

## Running Locally
- First, clone this repository. This repository has files that are very large. Thus, it uses Github LFS. These 
  large files are training data and testing data because sample data are also provided in this repository. 
- Once you cloned the repository, run following in order to build sajilonet using npm. sajilonet is our
  neural net library which we will use in our eyenet. 
  ```
  cd sajilonet
  npm run bundle //This creates sajilonet.js file sajilonet/dist folder.
  ```
- You can also run test using following command. For testing, we are using jasmine library. 
  ```
  cd sajilonet 
  npm run test //This runs jasmine test defined in sajilonet/spec folder. 
  ```
- Now, you can simply copy sajilonet.js file that was generated from earlier and paste it in asset/dist/js 
  folder. 
- Finally, you can open index.html file on your favorite browser. 

If you would like to access the one that is currently deployed, you can check [here](https://paudelbikram.github.io/eyenet/)