<script>
  import { onMount } from "svelte";
  import Auth from './Auth';
  export let id;
  let name = '';
  let username = '';
  let isFetchingUser = false;
  let days = {};

  onMount(async () => {    
    console.log('fetching apikey')
    let apiKey = Auth.getApiKey();
    console.log('apikey', apiKey)
    isFetchingUser = true;
    try {
      const res = await fetch(`https://ffscgzwcd4.execute-api.ap-southeast-2.amazonaws.com/prod/users?id=${id}&api_key=${apiKey}`);
      let o = await res.json();
      name = o.name;
      username = o.username;
      days = o.statuses;
      console.log(o)
    } catch (e) {
      console.log('Failed to fetch user status', e);
    }
    isFetchingUser = false;
  });

  function getStatusHsl(hour) {
    let on = hour.online;
    let off = hour.offline;
    let onelineRate = Math.round((on / (on + off)) * 100);
    // let lightness = 0.3 * prob + 30
    
    let lightness = -0.9 * onelineRate + 100;
    let hsl = 'lightgray';
    if (onelineRate > 0 ) {
      hsl = `hsl(115, 100%, ${lightness}%)`;
    }

    return hsl;
  }
</script>

<main>
  {#if isFetchingUser}
    <div class="loading-component">
      <img src="/dual-ring.gif" alt="Loading.." width="20" height="20"><span>Fetching..</span>
    </div>
  {/if}
  <b>
    {#if username }
      <p>{username}</p>
    {/if}
  </b>
  {#if name }
    <p>{name}</p>
  {/if}
  <table>
  {#each Object.keys(days) as day}
    <tr><td>{day.split('/').slice(0, 2).join('/')}</td>
      {#each Object.keys(days[day].hours).sort() as hour}
        <td>
          <span 
            class="status-bar tooltip"
            style="background-color: {getStatusHsl(days[day]['hours'][hour])}"
            title={Math.round(days[day]['hours'][hour]['online'] / (days[day]['hours'][hour]['online'] + days[day]['hours'][hour]['offline']) * 100) + '% online rate'}
          >
            <span class="tooltiptext">
              {hour}
              <br>
              {Math.round(days[day]['hours'][hour]['online'] / (days[day]['hours'][hour]['online'] + days[day]['hours'][hour]['offline']) * 100) + '% online'}
            </span>
        </span>
        </td>
      {/each}
    </tr>
  {/each}
</table>
</main>