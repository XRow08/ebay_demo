const checkUnits = (ev) => {
  const quantity = document.querySelector("#quantity").innerText;
  if (Number(ev.value) > quantity) {
      ev.value = quantity;
  };
};
jQuery('<div class="quantityChoose-nav"><div class="quantityChoose-button quantityChoose-up">+</div><div class="quantityChoose-button quantityChoose-down">-</div></div>').insertAfter('.quantityChoose input');
jQuery('.quantityChoose').each(function () {
  var spinner = jQuery(this),
      input = spinner.find('input[type="number"]'),
      btnUp = spinner.find('.quantityChoose-up'),
      btnDown = spinner.find('.quantityChoose-down'),
      min = input.attr('min'),
      max = input.attr('max');

  btnUp.click(function () {
      var oldValue = parseFloat(input.val());
      if (oldValue >= max) {
          var newVal = oldValue;
      } else {
          var newVal = oldValue + 1;
      }
      spinner.find("input").val(newVal);
      spinner.find("input").trigger("change");
  });

  btnDown.click(function () {
      var oldValue = parseFloat(input.val());
      if (oldValue <= min) {
          var newVal = oldValue;
      } else {
          var newVal = oldValue - 1;
      }
      spinner.find("input").val(newVal);
      spinner.find("input").trigger("change");
  });

});