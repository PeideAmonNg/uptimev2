<script>
  import { Router, Link, Route } from "svelte-routing";
  import User from './User.svelte';
  import Home from './Home.svelte'

</script>
<main>
  <Router url="">
    <nav>
    </nav>
    <div>
      <Route path="/" component="{Home}"></Route>
      <Route path="/users/:id" component="{User}"></Route>
    </div>
  </Router>
</main>