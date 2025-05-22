$(document).ready(function() {
    let tableClickCount = 0;
    let totalTables = 4;
    let isScrollByButton = false;
    let scrollDebounce;
    let initialScrollSteps = getInitialScrollSteps(); // Get steps based on URL
    let initialScrollPosition = initialScrollSteps * 200; // Convert steps to pixels

     // Scroll based on product number
     setTimeout(function () {
        $(".over-flow").scrollLeft(initialScrollPosition);
        tableClickCount = initialScrollSteps; // Update count
        updateTableButtons();
     }, 300); // Delay to allow rendering

  
  
    updateTableButtons();
    $(".over-flow").scroll(function() {
        if (scrollDebounce) {
            clearTimeout(scrollDebounce);
        }
        scrollDebounce = setTimeout(function() {
            if (!isScrollByButton) {
                console.log(tableClickCount, "scroll1");
                tableClickCount = Math.round($(".over-flow").scrollLeft() / 200);
                console.log(tableClickCount, "scroll2");
                updateTableButtons();
            }
            isScrollByButton = false;
        }, 200);
    });
    $("#next-table").click(function(event) {
        event.preventDefault();
        tableClickCount += 1;
        console.log(tableClickCount, "next");
        $(".over-flow").animate({
            scrollLeft: tableClickCount * 200,
        }, "slow");
        isScrollByButton = true;
        updateTableButtons();
    });
    $("#previous-table").click(function(event) {
        event.preventDefault();
        tableClickCount -= 1;
        console.log(tableClickCount, "previous");
        $(".over-flow").animate({
            scrollLeft: tableClickCount * 200,
        }, "slow");
        isScrollByButton = true;
        updateTableButtons();
    });
    function updateTableButtons() {
        let previousTableButton = $("#previous-table");
        let nextTableButton = $("#next-table");
        previousTableButton.toggleClass("hide-table-button", tableClickCount === 0);
        nextTableButton.toggleClass("hide-table-button", tableClickCount === totalTables);
    }

  function getInitialScrollSteps() {
            let url = window.location.href;
            if (url.includes("medical-7plus")) return 4; // 4 steps (800px)
            if (url.includes("medical-6")) return 3; // 3 steps (600px)
            if (url.includes("medical-5")) return 2; // 2 steps (400px)
            if (url.includes("medical-4")) return 1; // 1 step (200px)


            if (url.includes("traditional-8-plus")) return 4; // 4 steps (800px)
            if (url.includes("traditional-7")) return 3; // 1 step (400px) 
            if (url.includes("traditional-6")) return 2; // 1 step (400px)
            if (url.includes("traditional-5")) return 1; // 1 step (200px)

            if (url.includes("nature-8")) return 4; // 4 steps (800px)
            if (url.includes("nature-7")) return 3; // 1 step (400px) 
            if (url.includes("nature-6")) return 2; // 1 step (400px)
            if (url.includes("nature-5")) return 1; // 1 step (200px)

            if (url.includes("commercial-spa-489plus")) return 4; // 4 steps (800px)
            if (url.includes("commercial-spa-488")) return 3; // 1 step (400px) 
            if (url.includes("commercial-spa-487")) return 2; // 1 step (400px)
            if (url.includes("commercial-spa-486")) return 1; // 1 step (200px)

            if (url.includes("commercial-spa-489-customized")) return 4; // 4 steps (800px)
            if (url.includes("commercial-spa-488-customized")) return 3; // 1 step (400px) 
            if (url.includes("commercial-spa-487-customized")) return 2; // 1 step (400px)
            if (url.includes("commercial-spa-486-customized")) return 1; // 1 step (200px)

            if (url.includes("custom6-9")) return 4; // 4 steps (800px)
            if (url.includes("custom4-5")) return 3; // 1 step (400px) 
            if (url.includes("custom3")) return 2; // 1 step (400px)
            if (url.includes("custom2")) return 1; // 1 step (200px) 

            if (url.includes("frozen-6-cold-plunge")) return 2; // 4 steps (800px)
            if (url.includes("frozen-5-cold-plunge")) return 1; // 1 step (400px) 


    
            if (url.includes("frozen-3-cold-plunge")) return 2; // 1 step (400px)
            if (url.includes("frozen-2-cold-plunge")) return 1; // 1 step (200px)



    
            return 0; // Default, no scroll
        }
});


$(document).ready(function() {
    var $popup = $(".see-popup");
    var $slideToggle = $(".slide-toggle");
    var $closeButton = $("#see-closee");
    function togglePopup(show) {
        if (show) {
            $("body").addClass("popup-active");
            $popup.show();
        } else {
            $popup.hide();
            $("body").removeClass("popup-active");
        }
    }
    $slideToggle.click(function(event) {
        event.stopPropagation();
        togglePopup($popup.css('display') === 'none');
    });
    $closeButton.click(function(event) {
        event.stopPropagation();
        togglePopup(false);
    });
    $popup.click(function(event) {
        event.stopPropagation();
    });
    $(document).click(function(event) {
        if (!$popup.is(event.target) && $popup.has(event.target).length === 0 && $popup.css('display') !== 'none') {
            togglePopup(false);
        }
    });
});
;;