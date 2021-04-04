const rp = require("request-promise-native");
const fs = require("fs");
var nodemailer = require('nodemailer');

//Change this to your email address (used for gmail auth, gmail 'from', and gmail 'to')
var gmailUser = "CHANGEME@gmail.com"
//You need to create an app password for Gmail.  Go here:  https://myaccount.google.com/apppasswords
var gmailPass = "CHANGEME"
//Who to send notifications to
var emailNotificationList = "CHANGEME@example.org, CHANGEMETOO@example.org"
//How long to wait between hitting the CVS site (in minutes)
var scrapeDelay = 2

//The cities we're looking for appointments in.  The value (false) is whether we've already sent an email when that
// city showed up with availability and is used to avoid sending an email unless the city flips back to fully booked,
// then back to available again.
let cityIds = new Map();
cityIds.set("ALPINE", false);
cityIds.set("CARLSBAD", false);
cityIds.set("CHULA VISTA", false);
cityIds.set("DEL MAR", false);
cityIds.set("EL CAJON", false);
cityIds.set("ENCINITAS", false);
cityIds.set("ESCONDIDO", false);
cityIds.set("LA JOLLA" , false);
cityIds.set("LA MESA" , false);
cityIds.set("POWAY", false);
cityIds.set("RANCHO BERNARDO", false);
cityIds.set("SAN MARCOS", false);
cityIds.set("SANTEE", false);
cityIds.set("SPRING VALLEY", false);
cityIds.set("SOLANA BEACH" , false);
cityIds.set("VISTA", false);
cityIds.set("OCEANSIDE", false);
cityIds.set("SAN DIEGO", false);
//You can uncomment the next line and add Sanger if you want to test the bot.  Sanger tends to have 
//appointments available all the time.
//cityIds.set("SANGER", false);

//****   You don't need to edit anything below here (hopefully)

async function main() {
  
  while (true) {

    var webScrape = await fetchCities();

    var cityData = webScrape.responsePayloadData.data.CA;

    //Each city we found on the CVS site
    for (const city of cityData) {

      //If it's one we're looking for appointments in
      if (cityIds.has(city.city))
      {
        //If there's availability
        if (city.status != "Fully Booked")
        {
          //If we didn't already send an email for this city's availability...
          if (cityIds.get(city.city) == false) {
            //Specify that we sent the email
            cityIds.set(city.city, true);
            //Send the email
            await commAppointment(city);
          }
        } else {
          //If there isn't availability in this city, reset the "already sent the email" flag.
          cityIds.set(city.city, false);
        }
      }
    }
    console.log("Done!");
    await delay();
  }
}

async function commAppointment(city) {
  console.log("Found appointment in " + city.city);
  
  var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass
  }
});

var mailOptions = {
  from: gmailUser,
  to: gmailUser,
  bcc: emailNotificationList,
  subject: 'Vaccine Bot',
  text: 'Appointment available in ' + city.city + '.  Click here to schedule:  https://www.cvs.com/vaccine/intake/store/cvd-schedule.html?icid=coronavirus-lp-vaccine-sd-statetool'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
}

// Waits between scraping the CVS site
function delay() {
  return new Promise(resolve => {
    setTimeout(() => resolve(), scrapeDelay * 60 * 1000);
  });
}

async function fetchCities() {
  //console.log('Making API Request');
  // add the playerId to the URI and the Referer header
  // NOTE: we could also have used the `qs` option for the
  // query parameters.

  console.log("Making API Request...");
  // request the data from the JSON API
  const results = await rp({
    uri: "https://www.cvs.com/immunizations/covid-19-vaccine.vaccine-status.CA.json?vaccineinfo",
    headers: {
      'authority': 'www.cvs.com',
      'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
      'accept': '*/*',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://www.cvs.com/immunizations/covid-19-vaccine',
      'accept-language': 'en-US,en;q=0.9',
      'cookie': 'QuantumMetricSessionLink=https://cvs.quantummetric.com/#/users/search?autoreplay=true&qmsessioncookie=675e8d76358a9fc7778ff2b4f7aa4acc&ts=1617457311-1617543711; pe=p1; acctdel_v1=on; adh_new_ps=on; adh_ps_pickup=on; adh_ps_refill=on; buynow=off; sab_displayads=on; dashboard_v1=off; db-show-allrx=on; disable-app-dynamics=on; disable-sac=on; dpp_cdc=off; dpp_drug_dir=off; dpp_sft=off; getcust_elastic=on; echomeln6=on; enable_imz=on; enable_imz_cvd=on; enable_imz_reschedule_instore=on; enable_imz_reschedule_clinic=off; flipp2=on; gbi_cvs_coupons=true; ice-phr-offer=off; v3redirecton=false; mc_cloud_service=on; mc_hl7=on; mc_home_new=on; mc_ui_ssr=off-p0; mc_videovisit=on; memberlite=on; pauth_v1=on; pivotal_forgot_password=off-p0; pivotal_sso=off-p0; pbmplaceorder=off; pbmrxhistory=on; ps=on; refill_chkbox_remove=off-p0; rxdanshownba=off; rxdfixie=on; rxd_bnr=on; rxd_dot_bnr=on; rxdpromo=on; rxduan=on; rxlite=on; rxlitelob=off; rxm=on; rxm_phone_dob=on; rxm_demo_hide_LN=off; rxm_phdob_hide_LN=on; rxm_rx_challenge=off; s2c_akamaidigitizecoupon=on; s2c_beautyclub=off-p0; s2c_digitizecoupon=on; s2c_dmenrollment=off-p0; s2c_herotimer=off-p0; s2c_newcard=off-p0; s2c_papercoupon=on; s2c_persistEcCookie=on; s2c_rewardstrackerbctile=on; s2c_rewardstrackerbctenpercent=on; s2c_rewardstrackerqebtile=on; s2c_smsenrollment=on; s2cHero_lean6=on; sft_mfr_new=on; sftg=on; show_exception_status=on; v2-dash-redirection=on; ak_bmsc=80C38F439C6A781BE4EFD332C5907920B833016D3C310000581969606BDF9D35~plYaM9gEaGRyj9zlQl6BQdPq+tado5hguPE0tD/eMLfLk4zhzzkJZmdak/63DJq+VcqWXomnmWpCIFCXKHWfu/Jg7p+NJyw6dDEB6rggGw3ZicqH3ZZy8zhGBlh0DiEqhjN3vTslgQwnfLVKKH8SJgt+PJs0P/y1oz5Fgmu7ZvnFVtxGUFZoBBygkiQ+s3chleoqhv+QyUMb4dnGmmw7/hwYF0AXxsjLppaRc6tx0brtk=; bm_sz=202868B0624B6D0C95410BD2457ED7F6~YAAQbQEzuMyCUYt4AQAADwCLmgvd/LxSmyFqMDPEOYBCQLw0ow3GqItLiYrZhcNhWDSmCXjJW/gcvNdctVldgKnhyPxJl8u+p42VJY2yBjyKGQIW+PVxcrnXbe63FW4gH+q2UhuW4KT9sBNF//H5Jcmttxc7cudUzELGRJwTWfSR5Dgnu05J+ztgnD98; mt.v=2.174777673.1617500505174; _group1=quantum; mt.sc=%7B%22i%22%3A1617500505867%2C%22d%22%3A%5B%5D%7D; AMCVS_06660D1556E030D17F000101%40AdobeOrg=1; AMCV_06660D1556E030D17F000101%40AdobeOrg=-330454231%7CMCIDTS%7C18722%7CMCMID%7C90341272995745908271015586858543838498%7CMCAAMLH-1618105306%7C9%7CMCAAMB-1618105306%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1617507706s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C3.1.2; CVPF=CT-USR; s_cc=true; gpv_p10=www.cvs.com%2Fimmunizations%2Fcovid-19-vaccine; _gcl_au=1.1.710898181.1617500509; bm_sv=60DA00E7FC4A2A6F6DC0C13F2CB78B30~nEAY6NIT7pn685ZZvYNFVxFqsb1Dq3sK8V7K0C6rwS4GDTMBwNmsmFV1MFIn1x+ycco2S4Uco2HiYnYdiRGTPt1NiPnYS1PUcDELiyjqUlZsTVLwyTxau7vcCA8w/zObnLPOnBt+PXHKIVk2+A0V0w==; gbi_sessionId=ckn2i1ggw00003b9alvpvii8e; gbi_visitorId=ckn2i1ggw00013b9az4ooygzo; _4c_mc_=83045c10-ce7d-415e-9207-865a08b87199; akavpau_www_cvs_com_general=1617500928~id=a922b60b65258b389f475d97a421c36b; _abck=8864B6FF72131FCF8B38089B14AE5B76~0~YAAQbQEzuOCCUYt4AQAA9RGLmgUj6DTG2GVBRLjf3LEdJxvbMhbY4/+q6V/vF5z6Lhk7ngZ+BIFYtDleCAu9JNIrd4Uy8ksdfabAAaKI2LBlnZjneFAT4ZhXKvpSELPCwcXSoaNIAMvg9P8hOjDZSdqHlqLSE7nmybIlYveZz3r7J4F5D8kfIxdReEQ8oGHSCMxAtEhra6Lr/fxpJMtJj/A9vAxifDSLh+RPeijqQ9tdHRDz1lxHfdu+MJ7eeyvaohAAL1T96QHO47txWQYETlsgJr+UjbG+7pmn3kZINN781JtFlcjzhg03lo+7WT7ha0/7fX/6A5UfPteZFET/w7DF67eMYmH9HjdiOmfuWo3o9MGSw7UHaGMIlhf9UrYDqqhhtcusMQSTUe7HADpuGyjq6sk8~-1~||-1||~-1; QuantumMetricSessionID=675e8d76358a9fc7778ff2b4f7aa4acc; QuantumMetricUserID=5c8ec73b0d45ec8163cf8444171a2721; RT="z=1&dm=cvs.com&si=682f9b95-1dc2-40e5-ad12-f79bc46cd3ef&ss=kn2i1cn8&sl=1&tt=53m&bcn=%2F%2F17c8edc6.akstat.io%2F&ld=53y&nu=1ssnj1p3&cl=vyu"; qmexp=1617502345562; gpv_e5=cvs%7Cdweb%7Cimmunizations%7Ccovid-19-vaccine%7Cpromo%3A%20covid-19%20vaccines%20in%20california%20modal; s_sq=%5B%5BB%5D%5D; utag_main=v_id:01789a8b06f00015d4bfc943cb8403073003206b00978$_sn:1$_ss:1$_pn:1%3Bexp-session$_st:1617502345932$ses_id:1617500505840%3Bexp-session$vapi_domain:cvs.com'
    },
    json: true
  });
  // save the JSON to disk
  //await fs.promises.writeFile("output.json", JSON.stringify(results, null, 2));
  //console.log("Done!")

  return results;
}

// start the main script
main();