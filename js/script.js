$(document).ready(function () {
  var headerHeight = $("header").outerHeight();
  var contentLoadedCache = {}; // Cache untuk menyimpan konten yang sudah dimuat
  var allSidebarItems = $(".sidebar-nav .nav-item").clone(); // Simpan semua item sidebar asli

  // Fungsi untuk memuat konten dan melakukan smooth scroll
  function loadContentAndScroll(
    hash,
    contentFile,
    isInitialLoad = false,
    scrollAfterLoad = true
  ) {
    if (!hash || !contentFile) return;

    var targetId = hash.substring(1); // Hapus '#' dari hash

    // Hapus kelas 'active' dari semua link dan tambahkan ke yang diklik
    $(".nav-link-custom").removeClass("active");
    $('a.nav-link-custom[href="' + hash + '"]').addClass("active");

    // Periksa apakah konten sudah ada di cache
    if (contentLoadedCache[contentFile]) {
      // Konten sudah ada, cukup scroll
      if (scrollAfterLoad) {
        // Hanya scroll jika diminta
        scrollToSection(hash);
      }
      // Inisialisasi ulang highlight search jika ada teks di input pencarian
      if ($("#searchInput").val() !== "") {
        triggerSearchHighlight();
      }
      // Animasi fade in untuk section yang sudah ada
      $("#content")
        .find(".doc-section")
        .css("opacity", 0)
        .each(function (index) {
          $(this)
            .delay(index * 100)
            .animate({ opacity: 1 }, 800);
        });
      return;
    }

    // Tampilkan loading spinner atau efek visual jika diinginkan
    $("#content").css("opacity", 0.5); // Efek loading sederhana

    // Muat konten dari file
    $("#content").load(
      "content/" + contentFile,
      function (response, status, xhr) {
        $("#content").css("opacity", 1); // Hilangkan efek loading

        if (status == "error") {
          console.error(
            "Error loading content from " +
              contentFile +
              ": " +
              xhr.status +
              " " +
              xhr.statusText
          );
          $("#content").html(
            '<div class="alert alert-danger">Failed to load content. Please try again.</div>'
          );
        } else {
          // Simpan konten di cache
          contentLoadedCache[contentFile] = true;

          // Setelah konten dimuat, lakukan smooth scroll ke section yang relevan
          if (scrollAfterLoad) {
            scrollToSection(hash);
          }

          // Inisialisasi ulang highlight search jika ada teks di input pencarian
          if ($("#searchInput").val() !== "") {
            triggerSearchHighlight();
          }
          // Animasi fade in untuk section yang baru dimuat
          $("#content")
            .find(".doc-section")
            .css("opacity", 0)
            .each(function (index) {
              $(this)
                .delay(index * 100)
                .animate({ opacity: 1 }, 800);
            });

          // Perbarui status collapse ikon setelah konten dimuat
          updateCollapseIcons();
        }

        hljs.highlightAll();
      }
    );
  }

  // Fungsi untuk melakukan smooth scroll ke section
  function scrollToSection(hash) {
    if ($(hash).length) {
      // Pastikan elemen target ada
      $("html, body").animate(
        {
          scrollTop: $(hash).offset().top - headerHeight - 10,
        },
        800
      );
    }
  }

  // Event listener untuk klik link di sidebar
  // Event delegation digunakan karena elemen sidebar akan difilter
  $("#sidebar").on("click", ".nav-link-custom", function (event) {
    event.preventDefault();
    var hash = $(this).attr("href");
    var contentFile = $(this).data("content-file");
    loadContentAndScroll(hash, contentFile, false, true); // Scroll setelah load
  });

  // Event listener untuk klik collapsible link di sidebar
  $("#sidebar").on(
    "click",
    '.nav-link[data-bs-toggle="collapse"]',
    function () {
      // Logika untuk memutar ikon panah (ini sudah ada di bagian bawah script)
      // Bootstrap handle toggling collapse, kita hanya perlu memutar ikon
    }
  );

  // Menandai link sidebar yang aktif saat scrolling (ini akan bekerja setelah konten dimuat)
  $(window).on("scroll", function () {
    var currentScrollPos = $(this).scrollTop();
    var sections = $("#content").find(".doc-section"); // Seleksi section hanya di area konten utama

    sections.each(function () {
      var sectionTop = $(this).offset().top - headerHeight - 20;
      var sectionBottom = sectionTop + $(this).outerHeight();
      var sectionId = $(this).attr("id");
      var correspondingNavLink = $(
        'a.nav-link-custom[href="#' + sectionId + '"]'
      );

      if (currentScrollPos >= sectionTop && currentScrollPos < sectionBottom) {
        if (!correspondingNavLink.hasClass("active")) {
          $(".nav-link-custom").removeClass("active"); // Hapus active dari semua
          correspondingNavLink.addClass("active");
        }
      }
    });

    // Tombol Scroll to Top logic
    if ($(this).scrollTop() > 300) {
      $("#scrollToTopBtn").removeClass("d-none").fadeIn();
    } else {
      $("#scrollToTopBtn").fadeOut(function () {
        $(this).addClass("d-none");
      });
    }
  });

  // Fungsi triggerSearchHighlight untuk digunakan setelah AJAX load
  function triggerSearchHighlight() {
    var searchText = $("#searchInput").val().toLowerCase();
    if (searchText === "") {
      // Hapus semua highlight dari konten utama jika searchbox kosong
      $("#content")
        .find("h2, h3, p, pre code, li")
        .each(function () {
          var originalText = $(this).data("original-text-search");
          if (originalText) {
            $(this).html(originalText);
          }
        });
      return;
    }

    $("#content")
      .find(".doc-section")
      .each(function () {
        var $section = $(this);
        // Simpan teks asli dan hapus highlight sebelumnya
        $section.find("h2, h3, p, pre code, li").each(function () {
          if (!$(this).data("original-text-search")) {
            $(this).data("original-text-search", $(this).html());
          }
          $(this).html($(this).data("original-text-search")); // Reset ke teks asli
        });

        // Cari di dalam elemen h2, h3, p, pre code, li untuk highlight
        $section.find("h2, h3, p, pre code, li").each(function () {
          var $element = $(this);
          var elementText =
            $element.data("original-text-search") || $element.html();
          var highlightedText = elementText;

          if (elementText.toLowerCase().includes(searchText)) {
            var regex = new RegExp(searchText, "gi");
            highlightedText = elementText.replace(regex, function (match) {
              return '<span class="highlight">' + match + "</span>";
            });
          }
          $element.html(highlightedText);
        });
      });
  }

  // Fungsi Pencarian Utama
  $("#searchInput").on("keyup", function () {
    var searchText = $(this).val().toLowerCase();
    var allContentSections = $("#content").find(".doc-section");
    var sidebarNavList = $("#sidebar .sidebar-nav");

    // Reset sidebar ke kondisi awal
    sidebarNavList.empty().append(allSidebarItems.clone());
    var currentSidebarLinks = sidebarNavList.find(".nav-link-custom");
    var currentSidebarCollapses = sidebarNavList.find(
      '.nav-link[data-bs-toggle="collapse"]'
    );

    // Reset highlight di sidebar dan simpan teks asli
    currentSidebarLinks.add(currentSidebarCollapses).each(function () {
      var $element = $(this).find(".nav-link-text"); // Asumsi teks link ada di span
      if (!$element.length) {
        // Jika tidak ada span, ambil teks langsung dari link
        $element = $(this);
      }
      if (!$element.data("original-text-search")) {
        $element.data("original-text-search", $element.html());
      }
      $element.html($element.data("original-text-search"));
    });

    if (searchText === "") {
      // Tampilkan semua section konten utama
      allContentSections.css("display", "block").css("opacity", 1);

      // Tampilkan semua item sidebar
      sidebarNavList.empty().append(allSidebarItems.clone());
      updateCollapseIcons(); // Perbarui ikon collapse

      // Hapus semua highlight dari konten utama dan sidebar
      $("#content")
        .find("h2, h3, p, pre code, li")
        .each(function () {
          var originalText = $(this).data("original-text-search");
          if (originalText) $(this).html(originalText);
        });
      return;
    }

    var relevantSectionIds = new Set();
    var relevantSidebarHashes = new Set();
    var allSidebarLinkTexts = []; // Untuk mencari di semua teks link sidebar

    // 1. Filter konten utama dan kumpulkan ID section yang relevan
    allContentSections.each(function () {
      var $section = $(this);
      var matchFoundInSection = false;

      // Cari di dalam elemen h2, h3, p, pre code, li
      $section.find("h2, h3, p, pre code, li").each(function () {
        var $element = $(this);
        var elementText =
          $element.data("original-text-search") || $element.html();

        if (elementText.toLowerCase().includes(searchText)) {
          matchFoundInSection = true;
        }
      });

      if (matchFoundInSection) {
        relevantSectionIds.add($section.attr("id"));
        $section
          .css("display", "block")
          .css("opacity", 0)
          .animate({ opacity: 1 }, 500);
      } else {
        $section.css("display", "none").css("opacity", 0);
      }
    });

    // 2. Filter dan highlight sidebar
    sidebarNavList.empty(); // Kosongkan sidebar untuk mengisi ulang dengan yang difilter

    allSidebarItems.each(function () {
      var $originalItem = $(this);
      var $clonedItem = $originalItem.clone(); // Kloning item untuk manipulasi

      var isTopLevelCategory =
        $clonedItem.find('.nav-link[data-bs-toggle="collapse"]').length > 0 ||
        ($clonedItem.find(".nav-link-custom").length > 0 &&
          $clonedItem.find("ul").length === 0);

      // Periksa jika ini kategori induk dengan sub-item
      if (isTopLevelCategory && $clonedItem.find(".collapse").length > 0) {
        var $topLevelLink = $clonedItem.find(
          '.nav-link[data-bs-toggle="collapse"]'
        );
        var $collapseContent = $clonedItem.find(".collapse");
        var $subLinks = $collapseContent.find(".nav-link-custom");
        var hasSubMatch = false;

        // Cek apakah ada sub-link yang cocok
        $subLinks.each(function () {
          var $subLink = $(this);
          var subLinkText = $subLink.text().toLowerCase();
          if (
            subLinkText.includes(searchText) ||
            relevantSectionIds.has($subLink.attr("href").substring(1))
          ) {
            hasSubMatch = true;
            var regex = new RegExp(searchText, "gi");
            $subLink.html(
              $subLink
                .html()
                .replace(regex, '<span class="highlight">$&</span>')
            );
          } else {
            $subLink.remove(); // Hapus sub-link yang tidak cocok
          }
        });

        // Jika ada sub-link yang cocok ATAU judul kategori cocok, tampilkan kategori induk
        var topLevelLinkText = $topLevelLink.text().toLowerCase();
        if (hasSubMatch || topLevelLinkText.includes(searchText)) {
          if (topLevelLinkText.includes(searchText)) {
            var regex = new RegExp(searchText, "gi");
            $topLevelLink.html(
              $topLevelLink
                .html()
                .replace(regex, '<span class="highlight">$&</span>')
            );
          }
          $collapseContent.addClass("show"); // Pastikan sub-menu terbuka
          sidebarNavList.append($clonedItem);
        }
      }
      // Periksa jika ini link tanpa sub-item
      else if (
        isTopLevelCategory &&
        $clonedItem.find(".nav-link-custom").length > 0
      ) {
        var $link = $clonedItem.find(".nav-link-custom");
        var linkText = $link.text().toLowerCase();
        if (
          linkText.includes(searchText) ||
          relevantSectionIds.has($link.attr("href").substring(1))
        ) {
          var regex = new RegExp(searchText, "gi");
          $link.html(
            $link.html().replace(regex, '<span class="highlight">$&</span>')
          );
          sidebarNavList.append($clonedItem);
        }
      }
    });

    updateCollapseIcons(); // Perbarui ikon setelah filter sidebar
  });

  // Tombol Scroll to Top handler (tidak berubah)
  $("#scrollToTopBtn").on("click", function () {
    $("html, body").animate({ scrollTop: 0 }, 800);
    return false;
  });

  // Fungsi untuk mengontrol ikon panah pada collapsible sidebar
  function updateCollapseIcons() {
    $('.sidebar-nav .nav-link[data-bs-toggle="collapse"]').each(function () {
      const targetId = $(this).attr("href");
      if ($(targetId).hasClass("show")) {
        $(this)
          .find(".collapse-icon")
          .removeClass("fa-chevron-right")
          .addClass("fa-chevron-down");
      } else {
        $(this)
          .find(".collapse-icon")
          .removeClass("fa-chevron-down")
          .addClass("fa-chevron-right");
      }
    });
  }

  // ---- Initial Load: Muat konten awal saat halaman pertama kali dibuka ----
  // Kita akan memuat 'welcome.html' dan 'installation.html'
  // secara default saat halaman dimuat, sesuai dengan layout gambar.
  // Anda bisa menyesuaikan ini.
  loadContentAndScroll("#welcome", "welcome.html", true, false); // Jangan scroll awal
  // loadContentAndScroll('#installation', 'installation.html', true, false); // Jangan scroll awal

  // Aktifkan link 'Installation' secara default di sidebar
  $('a.nav-link-custom[href="#installation"]').addClass("active");

  // Inisialisasi ikon collapse saat dokumen siap
  updateCollapseIcons();
});
