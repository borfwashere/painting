// year-data.js - Loads specific year data based on URL parameter
(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var year = urlParams.get('y');

    if (!year || !/^\d{4}$/.test(year)) {
        window.location.href = 'index.html';
        return;
    }

    // Load the specific year data file
    var script = document.createElement('script');
    script.src = 'data/' + year + '.js';
    script.onload = function() {
        if (typeof publicationsData === 'undefined' || !publicationsData[year]) {
            console.error('No data found for year:', year);
            return;
        }

        // Update year display
        var desktopSpan = document.getElementById('current-year');
        var mobileSpan = document.getElementById('current-year-mobile');
        if (desktopSpan) desktopSpan.textContent = year;
        if (mobileSpan) mobileSpan.textContent = year;

        // Populate year links in nav
        var allYears = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
        var emptyYears = [2021];

        var mainList = document.getElementById('main-work-list');
        var mobileList = document.getElementById('mobile-work-list');

        allYears.forEach(function(y) {
            if (emptyYears.indexOf(y) !== -1) return;

            var li = document.createElement('li');
            li.className = 'blog-collection';
            var a = document.createElement('a');
            a.href = 'year.html?y=' + y;
            a.textContent = y;
            if (String(y) === String(year)) {
                a.style.fontWeight = '700';
            }
            li.appendChild(a);
            if (mainList) mainList.appendChild(li);

            var mobileLi = document.createElement('li');
            var mobileA = document.createElement('a');
            mobileA.href = 'year.html?y=' + y;
            mobileA.textContent = y;
            mobileLi.appendChild(mobileA);
            if (mobileList) mobileList.appendChild(mobileLi);
        });

        // Initialize main.js with the loaded data
        if (typeof initPublications === 'function') {
            initPublications();
        }
    };
    document.head.appendChild(script);
})();
