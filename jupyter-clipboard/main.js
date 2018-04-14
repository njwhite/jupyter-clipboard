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

    function load_ipython_extension() {
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

        requirejs(
            ['https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js'],
            function (ClipboardJS) {
                if (!ClipboardJS.isSupported()) {
                    console.error('ClipboardJS not supported')
                    return
                }

                var clipboard = new ClipboardJS(
                    button[0],
                    {container: $('#jupyter-clipboard > div > div')[0]})
                clipboard.on('success', function(e) {
                    console.info('Action:', e.action);
                    console.info('Text:', e.text);
                    console.info('Trigger:', e.trigger);

                    e.clearSelection();
                });
                clipboard.on('error', function(e) {
                    console.error('Action:', e.action);
                    console.error('Trigger:', e.trigger);
                });

                var handle_msg=function(msg){
                    button.attr('data-clipboard-text', msg.content.data)
                    modal.modal('show')
                }
                
                // do this after copying to the clipboard, so we re-enable the keyboard manager
                // *after* we've copied the text from the text area.
                button.click(() => modal.modal('hide'))

                Jupyter.notebook.kernel.comm_manager.register_target(
                    'jupyter-clipboard',
                    (comm, msg) => comm.on_msg(handle_msg));
            },
            function (err) {
                console.error(err)
            },
        );

        callbacks = {
            shell: {
                reply: (e) => console.log("Installing pyperclip.copy: " + e.content.status)
            },
            iopub: {
                output: (e) => console.log(e)
            }
        }
        events.on("kernel_ready.Kernel", function() {
            Jupyter.notebook.kernel.execute(`
from ipykernel.comm import Comm
import pyperclip

comm = Comm(target_name='jupyter-clipboard')
pyperclip.copy = lambda x: comm.send(x)
`,
            callbacks);
    })


    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});
