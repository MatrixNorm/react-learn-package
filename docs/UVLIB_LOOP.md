```C
// unix/core.c

int uv_run(uv_loop_t* loop, uv_run_mode mode) {
  int timeout;
  int r;
  int can_sleep;

  r = uv__loop_alive(loop);
  if (!r)
    uv__update_time(loop);

  /* Maintain backwards compatibility by processing timers before entering the
   * while loop for UV_RUN_DEFAULT. Otherwise timers only need to be executed
   * once, which should be done after polling in order to maintain proper
   * execution order of the conceptual event loop. */
  if (mode == UV_RUN_DEFAULT && r != 0 && loop->stop_flag == 0) {
    uv__update_time(loop);
    uv__run_timers(loop);
  }

  while (r != 0 && loop->stop_flag == 0) {
    can_sleep =
        uv__queue_empty(&loop->pending_queue) &&
        uv__queue_empty(&loop->idle_handles);

    uv__run_pending(loop);
    uv__run_idle(loop);
    uv__run_prepare(loop);

    timeout = 0;
    if ((mode == UV_RUN_ONCE && can_sleep) || mode == UV_RUN_DEFAULT)
      timeout = uv__backend_timeout(loop);

    uv__metrics_inc_loop_count(loop);

    uv__io_poll(loop, timeout);

    /* Process immediate callbacks (e.g. write_cb) a small fixed number of
     * times to avoid loop starvation.*/
    for (r = 0; r < 8 && !uv__queue_empty(&loop->pending_queue); r++)
      uv__run_pending(loop);

    /* Run one final update on the provider_idle_time in case uv__io_poll
     * returned because the timeout expired, but no events were received. This
     * call will be ignored if the provider_entry_time was either never set (if
     * the timeout == 0) or was already updated b/c an event was received.
     */
    uv__metrics_update_idle_time(loop);

    uv__run_check(loop);
    uv__run_closing_handles(loop);

    uv__update_time(loop);
    uv__run_timers(loop);

    r = uv__loop_alive(loop);
    if (mode == UV_RUN_ONCE || mode == UV_RUN_NOWAIT)
      break;
  }

  /* The if statement lets gcc compile it to a conditional store. Avoids
   * dirtying a cache line.
   */
  if (loop->stop_flag != 0)
    loop->stop_flag = 0;

  return r;
}
```

```C
/////////////////////
// unix/internal.c //
/////////////////////

static void uv__update_time(uv_loop_t* loop) {
  /* Use a fast time source if available.  We only need millisecond precision.
   */
  loop->time = uv__hrtime(UV_CLOCK_FAST) / 1000000;
}

////////////
// time.c //
////////////

void uv__run_timers(uv_loop_t* loop) {
  struct heap_node* heap_node;
  uv_timer_t* handle;

  for (;;) {
    heap_node = heap_min(timer_heap(loop));
    if (heap_node == NULL)
      break;

    handle = container_of(heap_node, uv_timer_t, heap_node);
    if (handle->timeout > loop->time)
      break;

    uv_timer_stop(handle);
    uv_timer_again(handle);
    handle->timer_cb(handle);
  }
}

static struct heap *timer_heap(const uv_loop_t* loop) {
  return (struct heap*) &loop->timer_heap;
}

////////////////
// heap-inl.h //
////////////////

struct heap_node {
  struct heap_node* left;
  struct heap_node* right;
  struct heap_node* parent;
};

//////////////////
// include/uv.h //
//////////////////

struct uv_timer_t {
  void* data;
  uv_loop_t* loop;
  ...
  void* heap_node[3]; 
  ...
};

/////////////////
// uv_common.h //
/////////////////

#define container_of(ptr, type, member) \
  ((type *) ((char *) (ptr) - offsetof(type, member)))
```

```C

uv_timer_t* handle = container_of(heap_node, uv_timer_t, heap_node);
//
uv_timer_t* handle = (uv_timer_t *) ((char *) (heap_node) - offsetof(uv_timer_t, heap_node));
```

```C

struct uv_loop_t {
  /* User data - use this for whatever. */
  void* data;
  /* Loop reference counting. */
  unsigned int active_handles;
  struct uv__queue handle_queue;
  union {
    void* unused;
    unsigned int count;
  } active_reqs;
  /* Internal storage for future extensions. */
  void* internal_fields;
  /* Internal flag to signal loop stop. */
  unsigned int stop_flag;
  //UV_LOOP_PRIVATE_FIELDS
  unsigned long flags;                                                        
  int backend_fd;                                                             
  struct uv__queue pending_queue;                                             
  struct uv__queue watcher_queue;                                             
  uv__io_t** watchers;                                                        
  unsigned int nwatchers;                                                     
  unsigned int nfds;                                                          
  struct uv__queue wq;                                                        \
  uv_mutex_t wq_mutex;                                                        \
  uv_async_t wq_async;                                                        \
  uv_rwlock_t cloexec_lock;                                                   \
  uv_handle_t* closing_handles;                                               \
  struct uv__queue process_handles;                                           \
  struct uv__queue prepare_handles;                                           \
  struct uv__queue check_handles;                                             \
  struct uv__queue idle_handles;                                              \
  struct uv__queue async_handles;                                             \
  void (*async_unused)(void);  /* TODO(bnoordhuis) Remove in libuv v2. */     \
  uv__io_t async_io_watcher;                                                  \
  int async_wfd;                                                              \
  struct {                                                                    \
    void* min;                                                                \
    unsigned int nelts;                                                       \
  } timer_heap;                                                               \
  uint64_t timer_counter;                                                     \
  uint64_t time;                                                              \
  int signal_pipefd[2];                                                       \
  uv__io_t signal_io_watcher;                                                 \
  uv_signal_t child_watcher;                                                  \
  int emfile_fd;
  // UV_PLATFORM_LOOP_FIELDS
  uv__io_t inotify_read_watcher;                                              \
  void* inotify_watchers;                                                     \
  int inotify_fd; 
};
```