(function ($) {
  function bindGallery() {
    var frame;
    $('#khan-him-gallery-pick').on('click', function (e) {
      e.preventDefault();
      if (frame) {
        frame.open();
        return;
      }
      frame = wp.media({
        title: 'Галерея товара',
        button: { text: 'Выбрать' },
        multiple: true,
        library: { type: 'image' },
      });
      frame.on('select', function () {
        var selection = frame.state().get('selection');
        var ids = [];
        var $list = $('.khan-him-gallery-list').empty();
        selection.each(function (attachment) {
          attachment = attachment.toJSON();
          ids.push(attachment.id);
          var url =
            (attachment.sizes && attachment.sizes.thumbnail && attachment.sizes.thumbnail.url) ||
            attachment.url;
          var label = attachment.alt || attachment.title || attachment.filename || 'Фото товара';
          $list.append(
            $('<li/>')
              .attr('data-id', attachment.id)
              .append($('<img/>').attr('src', url).attr('alt', label))
          );
        });
        $('#khan_him_gallery_input').val(ids.join(','));
      });
      frame.open();
    });

    $('#khan-him-gallery-clear').on('click', function (e) {
      e.preventDefault();
      $('.khan-him-gallery-list').empty();
      $('#khan_him_gallery_input').val('');
    });
  }

  function bindDocuments() {
    var frame;
    var index = $('.khan-him-docs-list li').length;
    $('#khan-him-docs-pick').on('click', function (e) {
      e.preventDefault();
      if (frame) {
        frame.open();
        return;
      }
      frame = wp.media({
        title: 'Документ товара',
        button: { text: 'Прикрепить' },
        multiple: true,
      });
      frame.on('select', function () {
        var selection = frame.state().get('selection');
        selection.each(function (attachment) {
          attachment = attachment.toJSON();
          var i = index++;
          var $li = $('<li/>');
          $li.append(
            $('<input type="hidden"/>')
              .attr('name', 'khan_him_documents[' + i + '][id]')
              .val(attachment.id)
          );
          $li.append(
            $('<input type="text" class="widefat"/>')
              .attr('name', 'khan_him_documents[' + i + '][title]')
              .attr('placeholder', 'Название документа')
              .val(attachment.title || attachment.filename || '')
          );
          $li.append($('<span/>').text(attachment.filename || ''));
          $('.khan-him-docs-list').append($li);
        });
      });
      frame.open();
    });
  }

  function bindSpecs() {
    $('#khan-him-add-spec').on('click', function (e) {
      e.preventDefault();
      var i = $('#khan-him-specs .khan-him-spec-row').length;
      $('#khan-him-specs').append(
        $(
          '<p class="khan-him-spec-row">' +
            '<input type="text" name="khan_him_specs[' +
            i +
            '][name]" placeholder="Показатель">' +
            '<input type="text" name="khan_him_specs[' +
            i +
            '][value]" placeholder="Значение">' +
            '</p>'
        )
      );
    });
  }

  $(function () {
    bindGallery();
    bindDocuments();
    bindSpecs();
  });
})(jQuery);
