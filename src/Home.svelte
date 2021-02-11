<script>
  import { onMount } from "svelte";
  import { writable } from 'svelte/store';
  import Auth from './Auth';

  export let date;
  let users = [];
  let isFetchingUsers = true;

  onMount(async () => {
    let apikey = Auth.getApiKey();

    const res = await fetch(`/api/users?api_key=${apikey}`);
    if(res.status == 200) {
      users = await res.json();
      console.log(users);
    }
    isFetchingUsers = false;
  });

  export const user = writable({
  })

  async function handleOnSubmit() {
    console.log("Adding user", $user);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: $user.name,
        username: $user.username
      })
    })
    
    if(res && res.status == 201) {
      const savedUser = await res.json()
      console.log('successfully created user', savedUser);
      users = [...users, savedUser];
      $user = {};
    } 
  }

</script>

<main>
  <b>Users</b>
  <table>
  {#each users as user}
    <tr>
      <td><a href="/users/{user.id}">{user.username}</a></td>
    </tr>
  {/each}
  </table>
  {#if isFetchingUsers}
    <div class="loading-component">
      <img src="/dual-ring.gif" alt="Loading.." width="20" height="20"><span>Fetching..</span>
    </div>
  {/if}
  <form on:submit|preventDefault={handleOnSubmit} style="text-align: left;">
    <br>
    <hr>
    <b>New User</b>
    <br>
    <input name="username" bind:value={$user.username} placeholder="Enter username"><br>
    <input name="name" bind:value={$user.name} placeholder="Enter name"><br>
    <input type="submit" value="Add">
  </form>

</main>
