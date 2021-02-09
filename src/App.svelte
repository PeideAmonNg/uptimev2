<script>
  import { Router, Link, Route } from "svelte-routing";
  import User from './User.svelte';
  import Home from './Home.svelte';
  import UserStatus from './UserStatus.svelte';

</script>
<main>
  <Router url="">
    <nav>
    </nav>
    <div>
      <Route path="/" component="{Home}"></Route>
      <Route path="/users/:id" component="{User}"></Route>
      <Route path="/user-status" component="{UserStatus}"></Route>
    </div>
  </Router>
</main>