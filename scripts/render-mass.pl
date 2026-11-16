#!/usr/bin/perl
# Resolve the upstream Mass before exporting it. Upstream files remain unmodified.
use strict;
use warnings;
use utf8;
use FindBin qw($Bin);
use File::Spec;
use JSON::PP;
use Encode qw(decode);

my ($date, $number, $full) = @ARGV;
die "Expected YYYY-MM-DD, form number and optional full flag\n" unless ($date || '') =~ /^(\d{4})-(\d{2})-(\d{2})$/;
my ($year, $month, $day) = ($1, $2, $3);
$number ||= 1;
die "Invalid form number\n" unless $number =~ /^[123]$/;
my $workspace = $ENV{ORDO_WORKSPACE} || "$Bin/..";
$workspace =~ s{\\}{/}g;
$workspace =~ s{^([A-Za-z]):}{'/' . lc($1)}e if $^O =~ /msys|cygwin/;
my $root = File::Spec->rel2abs("$workspace/vendor/divinum-officium");
$root =~ s{\\}{/}g;
my $engine_dir = "$root/web/cgi-bin/missa";
unshift @INC, "$workspace/vendor/perl", "$engine_dir/..";
$ENV{REQUEST_METHOD} = 'GET';
$ENV{QUERY_STRING} = "date=$month-$day-$year&command=praySanctaMissa&version=Rubrics%201960%20-%201960&lang1=Latin&lang2=Portugues&langfb=Latin&Propers=" . ($full ? '0' : '1') . "&missanumber=$number&rubrics=1&solemn=0&content=0";
$ENV{SERVER_NAME} = 'localhost';
$ENV{SCRIPT_NAME} = '/cgi-bin/missa/missa.pl';
$ENV{DIRECTORIUM_DATA_PATH} = "$root/web/www/Tabulae";

open my $source_handle, '<:encoding(UTF-8)', "$engine_dir/missa.pl" or die "Cannot open $engine_dir/missa.pl (FindBin=$Bin): $!";
local $/;
my $source = <$source_handle>;
close $source_handle;
$source =~ s/use FindBin qw\(\$Bin\);/our \$Bin = q{.};/ or die "Unsupported upstream FindBin declaration";
my $injection = <<'PERL';
no warnings 'redefine';
*main::print_content = sub {
  my ($language1, $script1, $language2, $script2) = @_;
  my ($left, $right) = (0, 0);
  my @rows;
  while ($left < @$script1 || $right < @$script2) {
    $main::column = 1;
    my ($latin, $next_left) = main::getunit($script1, $left);
    $left = $next_left;
    my ($heading) = ($latin || '') =~ /^\s*(?:#|!!)([^\n]+)/;
    ($heading) = ($latin || '') =~ /^\s*&([A-Za-z]+)/ unless $heading;
    my $la = $latin ? main::resolve_refs($latin, $language1) : '';
    $main::column = 2;
    my ($portuguese, $next_right) = main::getunit($script2, $right);
    $right = $next_right;
    my $pt = $portuguese ? main::resolve_refs($portuguese, $language2) : '';
    push @rows, { label => $heading || '', la => $la || '', pt => $pt || '' } if $la || $pt;
  }
  $main::ordo_export = {
    date => $main::date1,
    winner => $main::winner,
    title => $main::dayname[1],
    comment => $main::dayname[2],
    rule => $main::rule,
    number => 0 + $main::missanumber,
    gloria => main::gloriflag() ? JSON::PP::false : JSON::PP::true,
    credo => main::Credo() ? JSON::PP::false : JSON::PP::true,
    omitPsalm => main::Introibo() ? JSON::PP::true : JSON::PP::false,
    rows => \@rows,
  };
};
PERL
$source =~ s{(require "\$Bin/propers\.pl";)}{$1\n$injection} or die "Unsupported upstream loader";
$source =~ s{(set_runtime_options\('parameters'\);)}{$1\n\$main::pope = 'N.,N.'; \$main::bishop = 'N.,N.';} or die "Unsupported upstream parameters";
$FindBin::Bin = '.';

# Upstream writes page headers and controls; retain only the structured export.
open my $original_stdout, '>&', \*STDOUT or die $!;
open STDOUT, '>', File::Spec->devnull or die $!;
my $ok;
{
  no strict;
  no warnings;
  $ok = eval $source;
}
my $failure = $@;
close STDOUT;
open STDOUT, '>&', $original_stdout or die $!;
binmode STDOUT, ':encoding(UTF-8)';
die "Upstream engine failed: $failure\n" if $failure;
no strict 'refs';
my $export = $main::ordo_export;
die "Upstream produced no Mass: $date\n" unless $export && @{$export->{rows} || []};
$export->{error} = $main::error || '';
print JSON::PP->new->canonical->encode($export);
