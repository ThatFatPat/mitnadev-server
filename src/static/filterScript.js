function toggleFilter() {
    const filterform = document.getElementById("filterform")
    if (filterform.hasAttribute("hidden")) {
        filterform.removeAttribute("hidden")
    }
    else{
        filterform.setAttribute("hidden")
    }
}


$("#textfil").on('change keyup paste', function () {
    filterTable();
});

function filterTable() {
    var input, filter, table, tr, td, i;
    input = document.getElementById("textfil")
    filter = input.value.toUpperCase();
    table = document.getElementById("studenttable");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
        tds = tr[i].getElementsByTagName("td");
        let filters = true
        for (let td of tds) {
            if (td.innerHTML.toUpperCase().indexOf(filter) === -1) {
                filters = false
                break
            } 
        }
        if (filters) {
            tr[i].style.display = "";
        } else {
            tr[i].style.display = "none";
        }
    }            
}