document.addEventListener("DOMContentLoaded",()=>{

  const search=document.getElementById("searchInput");
  const rows=document.querySelectorAll(".user-row");
  const count=document.getElementById("count");

  if(search){
    search.addEventListener("input",()=>{
      const value=search.value.toLowerCase();
      let visible=0;

      rows.forEach(row=>{
        const show=row.innerText.toLowerCase().includes(value);
        row.style.display=show?"":"none";
        if(show) visible++;
      });

      if(count) count.textContent=visible;
    });
  }

});
