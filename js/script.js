(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- reveal ao rolar ---------- */
  (function(){
    var root = document.documentElement;
    if(!('IntersectionObserver' in window) || reduceMotion.matches){
      root.classList.remove('js-reveal');
      return;
    }

    var targets = document.querySelectorAll(
      '.reveal, .sec-head, .shelf-item, .ig-col, .cta-final .wrap > div'
    );
    if(!targets.length){ root.classList.remove('js-reveal'); return; }

    // escalona irmãos que aparecem juntos, sem deixar o último lento demais
    var seen = new Map();
    targets.forEach(function(el){
      var n = seen.get(el.parentNode) || 0;
      seen.set(el.parentNode, n + 1);
      el.setAttribute('data-reveal', '');
      if(n) el.style.setProperty('--reveal-delay', Math.min(n, 3) * 70 + 'ms');
    });

    function settle(el){
      // devolve o elemento aos estilos naturais (ex.: transform de hover)
      var done = function(){
        el.removeEventListener('transitionend', done);
        el.removeAttribute('data-reveal');
        el.style.removeProperty('--reveal-delay');
      };
      el.addEventListener('transitionend', done);
      setTimeout(done, 1200);
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        settle(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function(el){ io.observe(el); });
  })();

  /* ---------- rolagem suave nas âncoras ---------- */
  (function(){
    var header = document.querySelector('header.site');

    function offsetTop(){
      return (header ? header.getBoundingClientRect().height : 0) + 14;
    }
    function maxScroll(){
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function easeInOutCubic(t){
      return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    var running = false;
    function cancel(){ running = false; }

    function scrollToEl(el, after){
      var start = window.pageYOffset;
      var end = (el.id === 'topo' || el === header)
        ? 0
        : Math.round(start + el.getBoundingClientRect().top - offsetTop());
      end = Math.max(0, Math.min(end, maxScroll()));

      var dist = end - start;
      if(reduceMotion.matches || Math.abs(dist) < 2){
        window.scrollTo(0, end);
        if(after) after();
        return;
      }

      // 380ms de piso, ~0.28ms por pixel, teto de 720ms
      var duration = Math.min(720, Math.max(380, Math.abs(dist) * 0.28));
      var startTime = null;
      running = true;

      function step(now){
        if(!running) return;
        if(startTime === null) startTime = now;
        var p = Math.min(1, (now - startTime) / duration);
        window.scrollTo(0, start + dist * easeInOutCubic(p));
        if(p < 1){
          requestAnimationFrame(step);
        } else {
          running = false;
          if(after) after();
        }
      }
      requestAnimationFrame(step);
    }

    // se a pessoa rolar por conta própria, a animação sai da frente
    ['wheel','touchstart','keydown'].forEach(function(evt){
      window.addEventListener(evt, function(){ if(running) cancel(); }, { passive: true });
    });

    document.addEventListener('click', function(e){
      var link = e.target.closest ? e.target.closest('a[href]') : null;
      if(!link) return;

      var href = link.getAttribute('href');
      if(!href || href.charAt(0) !== '#' || href === '#') return;

      var target = document.getElementById(href.slice(1));
      if(!target) return;

      e.preventDefault();

      // fecha o menu mobile antes de medir, senão a altura do header muda no meio
      var menu = document.getElementById('mobileMenu');
      var burger = document.getElementById('burgerBtn');
      if(menu && !menu.hidden){
        menu.hidden = true;
        if(burger) burger.setAttribute('aria-expanded','false');
      }

      requestAnimationFrame(function(){
        scrollToEl(target, function(){
          // replaceState lança SecurityError quando a página roda em file://
          try{ history.replaceState(null, '', href); }catch(err){}

          if(!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
          target.focus({ preventScroll: true });
        });
      });
    });
  })();

  var burger = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');
  if(burger && menu){
    // menu em tela cheia: a página por baixo não rola enquanto ele está aberto
    var setMenu = function(open){
      menu.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function(){ setMenu(menu.hidden); });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ setMenu(false); });
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && !menu.hidden){ setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function(){
      if(!menu.hidden && window.innerWidth > 980) setMenu(false);
    });
  }

  /* ---------- hero: a palavra do título e o cartão de foto trocam juntos ---------- */
  (function(){
    var words = document.querySelectorAll('.hero-word span');
    var pics = document.querySelectorAll('.hero-swap img');
    if(words.length < 2 || reduceMotion.matches) return;
    var i = 0, timer = null;
    function next(){
      var j = (i + 1) % words.length;
      words[i].classList.remove('is-on'); words[i].classList.add('is-out');
      words[j].classList.remove('is-out'); words[j].classList.add('is-on');
      if(pics[i]) pics[i].classList.remove('is-on');
      if(pics[j]) pics[j].classList.add('is-on');
      var prev = words[i];
      setTimeout(function(){ prev.classList.remove('is-out'); }, 650);
      i = j;
    }
    function start(){ if(!timer) timer = setInterval(next, 2600); }
    function stop(){ clearInterval(timer); timer = null; }
    // só gira enquanto a hero está na tela e a aba está visível
    var hero = document.querySelector('.hero');
    if('IntersectionObserver' in window && hero){
      new IntersectionObserver(function(en){ en[0].isIntersecting ? start() : stop(); }).observe(hero);
    } else start();
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
  })();

  /* ---------- números da faixa laranja contam até o valor ao aparecer ---------- */
  (function(){
    var nums = document.querySelectorAll('.stats-band [data-count]');
    if(!nums.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;
    var fmt = function(v, dec){
      return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    function run(el){
      var to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10);
      var suf = el.dataset.suffix || '', t0 = null, dur = 1400;
      function step(t){
        if(t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e, dec) + suf;
        if(p < 1) requestAnimationFrame(step);
      }
      el.textContent = fmt(0, dec) + suf;
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        en.target.querySelectorAll('[data-count]').forEach(run);
        io.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    io.observe(document.querySelector('.stats-band'));
  })();

  /* ---------- header: compacta ao rolar e marca a seção atual ---------- */
  (function(){
    var header = document.querySelector('header.site');
    if(!header) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('nav.main a[href^="#"]'));
    var sections = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
    var ticking = false;
    function update(){
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      var mid = window.innerHeight * 0.35, current = -1;
      sections.forEach(function(sec, i){
        if(!sec) return;
        var r = sec.getBoundingClientRect();
        if(r.top <= mid && r.bottom > mid) current = i;
      });
      links.forEach(function(a, i){
        a.classList.toggle('is-active', i === current);
        if(i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

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

  var carousels = document.querySelectorAll('[data-carousel]');
  carousels.forEach(function(card){
    var track = card.querySelector('.car-track');
    var slides = card.querySelectorAll('.car-slide');
    var dotsWrap = card.querySelector('.car-dots');
    var prevBtn = card.querySelector('.car-prev');
    var nextBtn = card.querySelector('.car-next');
    var total = slides.length;
    if(!track || total < 2) return;

    var index = 0;
    var timer = null;
    var dots = [];

    slides.forEach(function(_, i){
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Ir para imagem ' + (i + 1));
      dot.addEventListener('click', function(){ show(i); restart(); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    function show(i){
      index = (i + total) % total;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function(d, di){ d.classList.toggle('is-active', di === index); });
      // o lightbox lê daqui qual slide está visível
      card.setAttribute('data-index', index);
    }
    function next(){ show(index + 1); }
    function prev(){ show(index - 1); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    function restart(){ stop(); timer = setInterval(next, 5000); }

    if(nextBtn) nextBtn.addEventListener('click', function(){ next(); restart(); });
    if(prevBtn) prevBtn.addEventListener('click', function(){ prev(); restart(); });
    card.addEventListener('mouseenter', stop);
    card.addEventListener('mouseleave', restart);

    // enquanto a imagem estiver em tela cheia o carrossel não avança por baixo
    card.addEventListener('carousel:pause', stop);
    card.addEventListener('carousel:resume', restart);

    show(0);
    restart();
  });

  /* ---------- imagem do carrossel em tela cheia ---------- */
  (function(){
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lightboxImg');
    var cap = document.getElementById('lightboxCap');
    var closeBtn = document.getElementById('lightboxClose');
    if(!box || !img || !closeBtn) return;

    var lastFocus = null;
    var pausedCard = null;

    function open(source){
      lastFocus = document.activeElement;

      img.src = source.currentSrc || source.src;
      img.alt = source.alt || '';
      if(cap) cap.textContent = source.alt || '';

      pausedCard = source.closest('[data-carousel]');
      if(pausedCard) pausedCard.dispatchEvent(new Event('carousel:pause'));

      // trava a rolagem do fundo sem deixar a página "pular" pela barra
      var gap = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if(gap > 0) document.body.style.paddingRight = gap + 'px';

      box.hidden = false;
      closeBtn.focus();
    }

    function close(){
      box.hidden = true;
      img.src = '';
      img.alt = '';
      if(cap) cap.textContent = '';

      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      if(pausedCard){
        pausedCard.dispatchEvent(new Event('carousel:resume'));
        pausedCard = null;
      }
      if(lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    }

    document.addEventListener('click', function(e){
      var target = e.target;
      if(!target.closest) return;

      // produto da prateleira: abre a foto dele
      var zoom = target.closest('.shelf-zoom');
      if(zoom){ e.preventDefault(); open(zoom.querySelector('img')); return; }

      var card = target.closest('[data-carousel]');
      if(!card) return;
      // setas e bolinhas continuam controlando o carrossel
      if(target.closest('.car-arrow') || target.closest('.car-dots') || target.closest('a')) return;

      var slides = card.querySelectorAll('.car-slide img');
      if(!slides.length) return;

      var i = parseInt(card.getAttribute('data-index'), 10) || 0;
      var slideImg = slides[i] || slides[0];

      e.preventDefault();
      open(slideImg);
    });

    closeBtn.addEventListener('click', close);

    // clique no fundo (fora da imagem) também fecha
    box.addEventListener('click', function(e){
      if(e.target === box || e.target.classList.contains('lightbox-fig')) close();
    });

    document.addEventListener('keydown', function(e){
      if(box.hidden) return;
      if(e.key === 'Escape'){ close(); return; }
      // mantém o foco preso no botão de fechar enquanto o overlay está aberto
      if(e.key === 'Tab'){ e.preventDefault(); closeBtn.focus(); }
    });
  })();
})();
