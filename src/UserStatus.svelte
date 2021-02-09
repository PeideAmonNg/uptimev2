<script>
  import { onMount } from "svelte";
  export let isFetchingUserStatuses = true;
  let userStatuses = [];
  onMount(async () => {
    const res = await fetch("/api/user-status");
    
    userStatuses = [...await res.json()];
    console.log(userStatuses);
    isFetchingUserStatuses = false;
  });

</script>

<style>
	strong { color: red; }
</style>

<main>
  <h1>User status</h1>
  {#if isFetchingUserStatuses}
    <div class="loading-component">
      <img src="dual-ring.gif" alt="Loading.." width="20" height="20"><span>Fetching user status</span>
    </div>
  {/if}
  {#each userStatuses as us}
    <p>
    <span class="date">{new Date(us.createdAt).toLocaleString()}</span> {us.username} <span class="{us.status}">{us.status}</span>
    </p>
  {/each}
</main>
