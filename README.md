# AZGen-web

## Local development

In App.vue, set the POST request URL to `localhost:8082` and make sure [azgen-api](https://github.com/arkorobotics/azgen-api) is running.
```
.post('http://localhost:8082', data)
//.post('https://api.activation.zone', data)
```

## Project setup
At the root of the azgen-web directory:
```
npm install
```

### Compiles and hot-reloads for development
Run the following command and access the site by referencing the "App running at:" print out:
```
npm run serve
```


### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


### Credits

Front end application by @eheinrich and @arkorobotics;
