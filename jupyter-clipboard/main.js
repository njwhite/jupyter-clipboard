define([
    'base/js/namespace',
    'base/js/events',
    'jquery',
    'require',
], function(
    Jupyter,
    events,
    $,
    requirejs,
) {
    // not using class `fade`
    var modal = $(`
<div id='jupyter-clipboard' class="modal bd-example-modal-sm" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
      <input type='button' data-clipboard-text="Just because you can doesn't mean you should — clipboard.js" value="Copy to clipboard">
    </div>
  </div>
</div>
`)

    function pyperclip() {
        function handle_msg(msg){
            var button = $('#jupyter-clipboard > div > div > input')
            button.attr('data-clipboard-text', msg.content.data)
            modal.modal('show')
        }
        
        console.debug('registering clipboard')
        Jupyter.notebook.kernel.comm_manager.register_target(
            'jupyter-clipboard',
            (comm, msg) => comm.on_msg(handle_msg));
        console.debug('registering clipboard...done')

        console.debug("installing pyperclip hook")
        callbacks = {
            shell: {
                reply: (e) => console.log("Installing pyperclip.copy: " + e.content.status)
            },
            iopub: {
                output: (e) => console.log(e)
            }
        }
        Jupyter.notebook.kernel.execute(`
from ipykernel.comm import Comm

comm = Comm(target_name='jupyter-clipboard')
def copy(x):
    comm.send(x)

try:
    import pandas.io.clipboard # has its own fork of pyperclip
    pandas.io.clipboard.copy = copy
    pandas.io.clipboard.clipboard_set = copy
except ImportError:
    pass
`,
        callbacks);
    }

    function setup(was_delayed) {
        console.log('running jupyter-clipboard setup, delayed=' + was_delayed)
        modal.appendTo('body');

        var button = $('#jupyter-clipboard > div > div > input')
        button.css('width', '100%')

        // Jupyter will try to copy the current cell instead of ClipboardJS's hidden text area
        // unless we disable its keyboard_manager hijacking
        modal.on('shown.bs.modal', function(){
            Jupyter.notebook.keyboard_manager.disable()
            button.focus();
        });
        modal.on('hidden.bs.modal', function(){
            Jupyter.notebook.keyboard_manager.enable();
            Jupyter.notebook.keyboard_manager.command_mode();
            var cell = Jupyter.notebook.get_selected_cell();
            if (cell) cell.select();
        });


        // install the hook server-side *after* we've registered the client-side
        // hook, and trigger now if the kernel is already alive!
        console.debug('installing hook')
        if (typeof Jupyter.notebook.kernel !== "undefined" && Jupyter.notebook.kernel !== null) {
            pyperclip();
        }
        events.on("kernel_ready.Kernel", pyperclip)

        requirejs(
            ['https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js'],
            function (ClipboardJS) {
                console.debug('ClipboardJS loaded by requirejs!')

                if (!ClipboardJS.isSupported()) {
                    console.error('ClipboardJS not supported')
                    return
                }

                var clipboard = new ClipboardJS(
                    button[0],
                    {container: $('#jupyter-clipboard > div > div')[0]})

                // do this after copying to the clipboard, so we re-enable the keyboard manager
                // *after* we've copied the text from the text area.
                button.click(() => modal.modal('hide'))
            },
            function (err) {
                console.error(err)
            },
        );        
    }

    function load_ipython_extension() {
        if (Jupyter.notebook._fully_loaded) {  
            console.debug("notebook _fully_loaded, starting setup")
            setup(false);
        } else {
            events.on("notebook_loaded.Notebook", function() {
                setup(true);
            })
        }

    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});
