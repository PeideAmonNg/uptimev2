<script>
  import { onMount } from "svelte";
  export let isFetchingUserStatuses = true;
  let userStatuses = [];
  onMount(async () => {
    let apiKey;
    while(!apiKey) {
      apiKey = prompt("Please enter your api key");
    } 
    try {
      const res = await fetch(`/api/user-status-last-online?api_key=${apiKey}`);
      if(res.status == 200) { 
        userStatuses = [...await res.json()];
      }
      isFetchingUserStatuses = false;
    } catch(e) {
      console.log('caught error', e)
    }

    
  });

  function formatDate(date) {
    let d = new Date(date);
    return `${d.getHours()}:${d.getMinutes()}`;
  }

  let previousDayMonth = '-1/-1'; // initialise to bogus value
  function sameDayMonthAsPrevious(date) {
    let d = new Date(date);
    let dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;
    let isSameDayMonth = dayMonth == previousDayMonth;
    previousDayMonth = dayMonth;
    return isSameDayMonth;
  }

  function getDayMonth(date) {
    let d = new Date(date);
    let dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;
    return dayMonth;  
  }
</script>

<style>
	strong { color: red; }
</style>

<main>
  <h1>uptime</h1>
  {#if isFetchingUserStatuses}
    <div class="loading-component">
      <img src="dual-ring.gif" alt="Loading.." width="20" height="20"><span>Fetching..</span>
    </div>
  {/if}
  <table>
  {#each userStatuses as us}
    {#if !sameDayMonthAsPrevious(us.createdAt)}
      <tr><td class="daymonth">{getDayMonth(us.createdAt)}</td></tr>
    {/if}
    <tr>
      <td class="date">{formatDate(us.createdAt)}</td><td>{us.username}</td><td><span class="{us.status}">{us.status}</span></td>
    </tr>
  {/each}
  </table>
</main>
