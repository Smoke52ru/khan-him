(function () {
  var KEY = (window.khanHim && window.khanHim.storageKey) || 'khan-him-request-list';

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateCount();
    renderList();
    syncFormItems();
  }

  function updateCount() {
    var n = read().length;
    document.querySelectorAll('[data-request-link]').forEach(function (el) {
      el.textContent = n > 0 ? 'Запрос (' + n + ')' : 'Запрос';
    });
    document.querySelectorAll('[data-request-count]').forEach(function (el) {
      el.textContent = String(n);
    });
  }

  function addItem(item) {
    var items = read();
    if (items.some(function (x) { return String(x.productId) === String(item.productId); })) {
      return;
    }
    items.push({
      productId: String(item.productId),
      name: item.name || '',
      sku: item.sku || '',
      quantity: item.quantity || '',
    });
    write(items);
  }

  function removeItem(productId) {
    write(read().filter(function (x) { return String(x.productId) !== String(productId); }));
  }

  function updateQuantity(productId, quantity) {
    write(
      read().map(function (x) {
        if (String(x.productId) !== String(productId)) return x;
        return Object.assign({}, x, { quantity: quantity });
      })
    );
  }

  function syncFormItems() {
    var mount = document.querySelector('[data-request-form-items]');
    if (!mount) return;
    mount.innerHTML = '';
    read().forEach(function (item, i) {
      ;['productId', 'name', 'sku', 'quantity'].forEach(function (field) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'items[' + i + '][' + field + ']';
        input.value = item[field] || '';
        mount.appendChild(input);
      });
    });
  }

  function renderList() {
    var list = document.querySelector('[data-request-cards]');
    var empty = document.querySelector('[data-request-empty]');
    var missing = document.querySelector('[data-request-missing]');
    var formWrap = document.querySelector('[data-request-form-wrap]');
    if (!list || !empty) return;

    var items = read();
    if (!items.length) {
      list.hidden = true;
      list.innerHTML = '';
      empty.hidden = false;
      if (formWrap) formWrap.hidden = true;
      syncFormItems();
      return;
    }

    var ids = items.map(function (x) { return x.productId; }).join(',');
    var url = (window.khanHim && window.khanHim.resolveUrl) || '';
    if (!url) {
      paintCards(items, {});
      return;
    }

    fetch(url + '?ids=' + encodeURIComponent(ids))
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var map = {};
        var gone = [];
        (rows || []).forEach(function (row) {
          map[String(row.id)] = row;
          if (!row.available) gone.push(String(row.id));
        });
        if (gone.length) {
          var kept = items.filter(function (x) { return gone.indexOf(String(x.productId)) === -1; });
          write(kept);
          if (missing) {
            missing.hidden = false;
            missing.textContent = 'Некоторые товары больше недоступны и убраны из списка.';
          }
          return;
        }
        if (missing) missing.hidden = true;
        paintCards(items, map);
      })
      .catch(function () {
        paintCards(items, {});
      });

    function paintCards(rows, map) {
      empty.hidden = true;
      list.hidden = false;
      if (formWrap) formWrap.hidden = false;
      list.innerHTML = '';
      rows.forEach(function (item) {
        var name = (map[item.productId] && map[item.productId].name) || item.name;
        var sku = (map[item.productId] && map[item.productId].sku) || item.sku || '';
        var li = document.createElement('li');
        li.className = 'request-card';
        li.innerHTML =
          '<div class="request-card__head">' +
          '<div>' +
          '<p class="request-card__name">' +
          escapeHtml(name) +
          '</p>' +
          (sku ? '<p class="request-card__sku formula">' + escapeHtml(sku) + '</p>' : '') +
          '</div>' +
          '<button type="button" class="btn-remove" data-remove="' +
          escapeAttr(item.productId) +
          '">Удалить</button>' +
          '</div>' +
          '<label class="request-card__qty">Объём и фасовка' +
          '<input class="field" data-qty="' +
          escapeAttr(item.productId) +
          '" value="' +
          escapeAttr(item.quantity || '') +
          '" placeholder="например, 2 бочки по 200 кг">' +
          '</label>';
        list.appendChild(li);
      });
      syncFormItems();
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add-to-request]');
    if (add) {
      e.preventDefault();
      addItem({
        productId: add.getAttribute('data-product-id'),
        name: add.getAttribute('data-product-name'),
        sku: add.getAttribute('data-product-sku'),
      });
      add.textContent = 'Уже в запросе';
      add.disabled = true;
      return;
    }
    var remove = e.target.closest('[data-remove]');
    if (remove) {
      e.preventDefault();
      removeItem(remove.getAttribute('data-remove'));
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-qty]');
    if (!input) return;
    updateQuantity(input.getAttribute('data-qty'), input.value);
  });

  document.addEventListener('DOMContentLoaded', function () {
    updateCount();
    renderList();
    syncFormItems();
    if (new URLSearchParams(location.search).get('clear_request_list') === '1') {
      write([]);
    }
    document.querySelectorAll('[data-add-to-request]').forEach(function (btn) {
      var id = btn.getAttribute('data-product-id');
      if (read().some(function (x) { return String(x.productId) === String(id); })) {
        btn.textContent = 'Уже в запросе';
        btn.disabled = true;
      }
    });
  });
})();
