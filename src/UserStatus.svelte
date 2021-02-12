<script>
  import { onMount } from "svelte";
  import Auth from './Auth';
  export let isFetchingUserStatuses = true;
  let userStatuses = [];
  let lastUpdated = '';
  onMount(async () => {
    let apiKey = Auth.getApiKey();
    try {
      const res = await fetch(`/api/user-status-last-online?api_key=${apiKey}`);
      if(res.status == 200) { 
        let o = await res.json();
        userStatuses = o.userStatuses;
        lastUpdated = o.lastUpdated;
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
<main>
  <b>Last Online</b>
  <table>
    <tr><td>Time now:</td><td>{new Date().toLocaleString('en-NZ')}</td></tr>
    {#if lastUpdated}
    <tr>
      <td>Last Updated:</td><td>{new Date(lastUpdated).toLocaleString('en-NZ')}</td>
    </tr>
    {/if}
  </table>
  {#if isFetchingUserStatuses}
    <div class="loading-component">
      <img src="/dual-ring.gif" alt="Loading.." width="20" height="20"><span>Fetching..</span>
    </div>
  {/if}
  <table>
  {#each userStatuses as us}
    {#if !sameDayMonthAsPrevious(us.createdAt)}
      <tr><td class="daymonth">{getDayMonth(us.createdAt)}</td></tr>
    {/if}
    <tr>
      <td class="time">{formatDate(us.createdAt)}</td><td><a href="/users/{us.userid}">{us.username}</a></td><td><span class="{us.status}">{us.status}</span></td>
    </tr>
  {/each}
  </table>
</main>
