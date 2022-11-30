function getBotResponse(input) {

    // Simple responses
    if ((input.toUpperCase()).includes("hello".toUpperCase()) || (input.toUpperCase()).includes("hi".toUpperCase())) {
        return "Hello there!";
     } else if ((input.toUpperCase() === "fine".toUpperCase()) || (input.toUpperCase() === "good".toUpperCase())){
            return "Nice ! \n How may I help you ?";
     } else if((input.toUpperCase()).includes("bye".toUpperCase())){
            return "Thank You ! Have a nice day.";
     } else if(((input.toUpperCase()).includes("fee".toUpperCase()) && (input.toUpperCase()).includes("month".toUpperCase())) || (input.toUpperCase()).includes("fee".toUpperCase())){
        return "₹ 1500/month with one time registartion fee of ₹ 1000";
     }else {
        return "You were not clear. Please say something else.";
    }
}