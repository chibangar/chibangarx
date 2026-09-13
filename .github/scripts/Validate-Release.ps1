Set-StrictMode -Version Latest

function Assert-ReleaseContext {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Tag,

        [Parameter(Mandatory)]
        [string]$PackageVersion,

        [Parameter(Mandatory)]
        [string]$TagObjectType,

        [Parameter(Mandatory)]
        [string]$TagCommit,

        [Parameter(Mandatory)]
        [string]$MainCommit,

        [Parameter(Mandatory)]
        [bool]$SignatureValid
    )

    if ($Tag -notmatch '^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$') {
        throw "Release tag '$Tag' is not a valid vX.Y.Z SemVer tag."
    }

    if ($Tag.Substring(1) -ne $PackageVersion) {
        throw "Release tag '$Tag' does not match package version '$PackageVersion'."
    }

    if ($TagObjectType -ne 'tag') {
        throw "Release reference '$Tag' must be an annotated tag."
    }

    if (-not $SignatureValid) {
        throw "Release tag '$Tag' does not have a valid cryptographic signature."
    }

    if ($TagCommit -ne $MainCommit) {
        throw "Release tag '$Tag' must point to the current origin/main commit."
    }
}
