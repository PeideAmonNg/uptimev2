<script>
  import { onMount } from "svelte";
  import { writable } from 'svelte/store';

  export let date;
  let users = [];
  let isFetchingUsers = true;

  onMount(async () => {
    const res = await fetch("/api/date");
    const newDate = await res.text();
    date = newDate;

    const res2 = await fetch('/api/users');
    users = await res2.json();
    console.log(users);
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
  <p>{date ? date : 'Loading date...'}</p>
  <ul id="users">
    {#each users as user}
      <li>
        <a href="/users/{user.id}">
          {user.username} {user.name ? `(${user.name})` : ''}
        </a>
      </li>
    {/each}
  </ul>
  {#if isFetchingUsers}
    Fetching users
  {/if}
  <form on:submit|preventDefault={handleOnSubmit} style="text-align: left;">
    <h5>New User</h5>
    <input name="username" bind:value={$user.username} placeholder="Enter username"><br>
    <input name="name" bind:value={$user.name} placeholder="Enter name"><br>
    <input type="submit" value="Add">
  </form>

</main>
