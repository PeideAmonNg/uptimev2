<script>
  import { onMount } from "svelte";
  import Auth from './Auth';
  export let id;
  let name = '';
  let userStatuses = [];
  let isFetchingUser = false;

  onMount(async () => {    
    console.log('fetching apikey')
    let apiKey = Auth.getApiKey();
    console.log('apikey', apiKey)
    isFetchingUser = true;
    const res = await fetch(`/api/user-status/${id}?api_key=${apiKey}`);
    let o = await res.json();
    userStatuses = o.userStatuses;
    name = o.name;
    isFetchingUser = false;
    console.log(userStatuses);
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
  {#if isFetchingUser}
    <div class="loading-component">
      <img src="/dual-ring.gif" alt="Loading.." width="20" height="20"><span>Fetching..</span>
    </div>
  {/if}
  <b>{userStatuses.length > 0 ? userStatuses[0].username : ''}</b>
  <p>{name}</p>
  <table>
  {#each userStatuses as us}
    {#if !sameDayMonthAsPrevious(us.createdAt)}
      <tr><td class="daymonth">{getDayMonth(us.createdAt)}</td></tr>
    {/if}
    <tr>
      <td class="time">{formatDate(us.createdAt)}</td>
      <td class="{us.status}">{us.status}</td>
    </tr>
  {/each}
</table>
</main>