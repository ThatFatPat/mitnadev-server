console.log(process.env.NODE_ENV)

module.exports.dev = {
        port : process.env.PORT || 3000,
        cors : "http://localhost:8080",
        db_username : "root",
        db_pass : "212702377",
        db_host : "127.0.0.1",
        db_name : "mitnadev"
}

module.exports.production = {
        port : process.env.PORT,
        cors : "https://evening-springs-71425.herokuapp.com",
        db_username : "b3fb81d1947453",
        db_pass : "31d7c5a7",
        db_host : "db4free.net",
        db_name : "mitnadev"
}

module.exports.choose_config = function(env){
    if (process.env.NODE_ENV === "dev"){
        return module.exports.dev
    }
    else if (process.env.NODE_ENV === "production"){
        return module.exports.production
    }
    else{
        throw Error("No configuration!")
    }
}