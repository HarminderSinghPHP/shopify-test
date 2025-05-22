$(document).ready(function () {
    let tableClickCount = 0;
    let totalTables = 3;
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

    $(".over-flow").scroll(function () {
        if (scrollDebounce) {
            clearTimeout(scrollDebounce);
        }

        scrollDebounce = setTimeout(function () {
            if (!isScrollByButton) {
                console.log(tableClickCount, "scroll1");
                tableClickCount = Math.round($(".over-flow").scrollLeft() / 200);
                console.log(tableClickCount, "scroll2");
                updateTableButtons();
            }
            isScrollByButton = false;
        }, 200); // Adjust the debounce timeout as needed
    });

    $("#next-table").click(function (event) {
        event.preventDefault();
        tableClickCount += 1;
        console.log(tableClickCount, "next");
        $(".over-flow").animate(
            {
                scrollLeft: tableClickCount * 200,
            },
            "slow"
        );
        isScrollByButton = true;
        updateTableButtons();
    });

    $("#previous-table").click(function (event) {
        event.preventDefault();
        tableClickCount -= 1;
        console.log(tableClickCount, "previous");
        $(".over-flow").animate(
            {
                scrollLeft: tableClickCount * 200,
            },
            "slow"
        );
        isScrollByButton = true;
        updateTableButtons();
    });

    function updateTableButtons() {
        let previousTableButton = $("#previous-table");
        let nextTableButton = $("#next-table");

        previousTableButton.toggleClass("hide-table-button", tableClickCount === 0);
        nextTableButton.toggleClass("hide-table-button", tableClickCount === totalTables - 1);
    }

    function getInitialScrollSteps() {
            let url = window.location.href; 
            
            if (url.includes("frozen-6-cold-plunge")) return 2; // 4 steps (800px)
            if (url.includes("frozen-5-cold-plunge")) return 1; // 1 step (400px) 

            if (url.includes("frozen-9-cold-plunge")) return 2; // 4 steps (800px)
            if (url.includes("frozen-8-cold-plunge")) return 1; // 1 step (400px) 


    
            if (url.includes("frozen-3-cold-plunge")) return 2; // 1 step (400px)
            if (url.includes("frozen-2-cold-plunge")) return 1; // 1 step (200px)



    
            return 0; // Default, no scroll
        }
  
});
