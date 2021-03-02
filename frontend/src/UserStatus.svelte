<script>
  import { onMount } from "svelte";
  import Auth from './Auth';
  export let isFetchingUserStatuses = true;
  let userStatuses = [];
  let lastUpdated = '';
  onMount(async () => {
    let apiKey = Auth.getApiKey();
    try {
      const res = await fetch(`https://ffscgzwcd4.execute-api.ap-southeast-2.amazonaws.com/prod/users-last-online?api_key=${apiKey}`);
      if(res.status == 200) { 
        let o = await res.json();
        userStatuses = o.userStatuses;
        lastUpdated = o.lastUpdated;
      }
      isFetchingUserStatuses = false;
    } catch(e) {
      console.log('Caught error', e)
    }
  });

  function formatDate(date) {
    let d = new Date(date);
    return `${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}`;
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
    let dayMonth = `${('0' + d.getDate()).slice(-2)}/${('0' + d.getMonth() + 1).slice(-2)}`;
    return dayMonth;  
  }

  function isOnline(lastOnlineDate) {
    let cronJobInterval = 5; // 5 minute interval
    let delay = 2; // delay from when crob job is actually called plus processing time
    if(Math.abs(new Date(lastOnlineDate).getTime() - new Date().getTime()) <= ((cronJobInterval + delay) * 60 * 1000))  {
      return true;
    } else {
      return false;
    }
  }
</script>
<main>
  <b>Last Online</b>
  <table>
    <tr><td>Time now:</td><td>{new Date().toLocaleString('en-NZ')}</td></tr>
    <tr>
      <td>Last Updated:</td><td>{!lastUpdated ? '' : new Date(lastUpdated).toLocaleString('en-NZ')}</td>
    </tr>
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
      <td class="time">{formatDate(us.createdAt)}</td><td><a href="/users/{us.userid}">{us.username}</a></td>
      {#if isOnline(us.createdAt)}
        <td><span class="online"></span></td>
      {/if}
    </tr>
  {/each}
  </table>
</main>
