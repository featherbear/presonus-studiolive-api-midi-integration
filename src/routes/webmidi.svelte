<script context='module'>
    export function preload(_, session) {
        if (!session.capabilities.webmidi) {
            return this.error(405, "WebMIDI is not enabled by the server")
        }
    }
</script>
<script>

</script>

<style lang="scss">

</style>

