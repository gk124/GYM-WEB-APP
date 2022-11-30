function Delete(){
    var con=window.confirm("Are you sure to delete your acoount?");
    if(con){
        window.location.href = "/delete";
    }
}

function Update(){
    var con=window.confirm("Are you sure to update your profile?");
    if(con){
        window.location.href = "./updateMember.pug" ;
    }
}

