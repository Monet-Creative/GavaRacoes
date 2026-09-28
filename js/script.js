(function(){
  var burger = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');
  if(burger && menu){
    burger.addEventListener('click', function(){
      var isHidden = menu.hidden;
      menu.hidden = !isHidden;
      burger.setAttribute('aria-expanded', String(isHidden));
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.hidden = true; burger.setAttribute('aria-expanded','false'); });
    });
  }

  var copyBtn = document.getElementById('copyPhone');
  if(copyBtn){
    copyBtn.addEventListener('click', function(){
      var text = '(24) 99266-9213';
      function done(){
        copyBtn.setAttribute('data-copied','1');
        copyBtn.textContent = 'Número copiado';
        setTimeout(function(){
          copyBtn.removeAttribute('data-copied');
          copyBtn.textContent = 'Copiar número';
        }, 2200);
      }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done, function(){
          fallbackCopy(text); done();
        });
      } else {
        fallbackCopy(text); done();
      }
      function fallbackCopy(t){
        var ta = document.createElement('textarea');
        ta.value = t; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        try{ document.execCommand('copy'); }catch(e){}
        document.body.removeChild(ta);
      }
    });
  }
})();
