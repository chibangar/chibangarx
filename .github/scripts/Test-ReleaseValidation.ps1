$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Validate-Release.ps1')

function Assert-Throws {
    param([scriptblock]$Action, [string]$Name)

    try {
        & $Action
    }
    catch {
        return
    }

    throw "Expected '$Name' to be rejected."
}

$commit = '0123456789abcdef0123456789abcdef01234567'

Assert-ReleaseContext -Tag 'v2.45.23' -PackageVersion '2.45.23' -TagObjectType 'tag' -TagCommit $commit -MainCommit $commit -SignatureValid $true

Assert-Throws { Assert-ReleaseContext -Tag 'release-2.45.23' -PackageVersion '2.45.23' -TagObjectType 'tag' -TagCommit $commit -MainCommit $commit -SignatureValid $true } 'non-version tag'
Assert-Throws { Assert-ReleaseContext -Tag 'v2.45.23' -PackageVersion '2.45.22' -TagObjectType 'tag' -TagCommit $commit -MainCommit $commit -SignatureValid $true } 'version mismatch'
Assert-Throws { Assert-ReleaseContext -Tag 'v2.45.23' -PackageVersion '2.45.23' -TagObjectType 'commit' -TagCommit $commit -MainCommit $commit -SignatureValid $true } 'lightweight tag'
Assert-Throws { Assert-ReleaseContext -Tag 'v2.45.23' -PackageVersion '2.45.23' -TagObjectType 'tag' -TagCommit $commit -MainCommit 'abcdefabcdefabcdefabcdefabcdefabcdefabcd' -SignatureValid $true } 'tag not at main'
Assert-Throws { Assert-ReleaseContext -Tag 'v2.45.23' -PackageVersion '2.45.23' -TagObjectType 'tag' -TagCommit $commit -MainCommit $commit -SignatureValid $false } 'unsigned tag'

Write-Host 'Release validation tests passed.'
