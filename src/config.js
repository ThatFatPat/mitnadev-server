if (process.node.NODE_ENV === "dev"){
    export default{
        port = process.env.PORT || 3000,
        cors = "http://localhost:8080",
        db_username = "root",
        db_pass = "212702377",
        db_host = "127.0.0.1",
        db_name = "mitnadev"
    }
}