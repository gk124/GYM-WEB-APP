axios.post( '/payment').then((info)=>{
    console.log(info);

    var options = {
        "key": "rzp_test_nAM0i25twseyRd", // Enter the Key ID generated from the Dashboard
        "name": "TORQUE FITNESS",
        "description": "GYM FEE",
        "image": "https://example.com/your_logo",
        "order_id": info.data.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "callback_url": "/update_payment",
        "theme": {
            "color": "#3399cc"
        }
    };

    var rzp1 = new Razorpay(options);
    document.getElementById('rzp-button1').onclick = function(e){
        rzp1.open();
        e.preventDefault();
    }
})