'use strict';

var Card = {

  registerHooks: function() {
    // using js6 fat arrow function declaration to bind to the correct this
    $(".recalc").change(() => this.updateCardInfo());
  },

  updateCardInfoOld: function() {
    var cardForm = document.getElementById("cardForm");
    var card = cardForm.elements["cardNumber"].value;
    var bin = card.slice(0, 6);

    $.ajax({
      url: "/api/binbase/" + bin,
      context: document.body,
      success: function(result) {
        if (result) {
          var bindata = "<b>Information about your card</b>: <br>&nbsp; &nbsp;" + result.cardBrand + ", " + result.cardType + ", " + result.cardCategory +
            ", " + result.issuingOrg + ", " + (result.isRegulated ? "regulated bank" : "unregulated bank") + "";
          var infoDiv = document.getElementById("cardInfo");
          $("#cardInfo").html(bindata);
        } else {
          console.log("info not found for bin: " + card);
          $("#cardInfo").html("<br><br>");
        }
      }
    });
  },

  updateCardInfo: function() {
    var cardForm = document.getElementById("cardForm");
    var card = cardForm.elements["cardNumber"].value;
    var amount = cardForm.elements["amount"].value;
    var bin = card.slice(0, 6);
    var url = "/api/estimateFee?bin=" + bin + '&amount=' + amount;
    //  alert("url: " + url);

    $.ajax({
      url: url,
      context: document.body,
      success: function(info) {
        if (info) {
          var bindata = "<b>Information about your card</b>: <br>&nbsp; &nbsp;" + info.cardBrand + ", " + info.cardType + ", " + info.cardCategory +
            ", " + info.issuingOrg + ", " + (info.isRegulated ? "regulated bank" : "unregulated bank") + "";
          bindata += "<br>Transaction fee for this card: <b>$" + info.estimatedFee + "</b>";
          bindata += "<br>&nbsp; &nbsp;" + info.feeTip;
          var infoDiv = document.getElementById("cardInfo");
          $("#cardInfo").html(bindata);
        } else {
          console.log("info not found for bin: " + card);
          $("#cardInfo").html("<br><br>");
        }
      }
    });
  }

}

module.exports = Card;
